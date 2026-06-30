"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ClinicalForm, {
  type ClinicalFormData,
  type PhotoUrls,
} from "@/components/clinical-form";
import ScannerSelect from "@/components/scanner-select";
import FinalizeTreatmentModal from "@/components/finalize-treatment-modal";
import { Spinner } from "@/components/ui/spinner";
import {
  PHOTO_KEYS,
  type ClinicalForm as ClinicalFormType,
  type Patient,
  type PhotoKey,
  type ScannerType,
} from "@/lib/types";

function emptyUrls(): PhotoUrls {
  const obj: Record<string, string | null> = {};
  PHOTO_KEYS.forEach((k) => {
    obj[k] = null;
  });
  return obj as PhotoUrls;
}

export default function ClinicalFormPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();

  const patientId = Number(searchParams.get("patient_id"));
  const scanId = searchParams.get("scan_id")
    ? Number(searchParams.get("scan_id"))
    : null;
  const isNew = searchParams.get("mode") === "new";
  const isView = searchParams.get("view") === "true";

  const [patient, setPatient] = useState<Patient | null>(null);
  const [existingForm, setExistingForm] = useState<ClinicalFormType | null>(
    null
  );
  const [existingImageUrls, setExistingImageUrls] = useState<PhotoUrls>(
    emptyUrls()
  );
  const [pageLoading, setPageLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState("");
  const [defaultScanner, setDefaultScanner] = useState<ScannerType | null>(null);

  // Modo A (contención con escaneo): type toggle + scanner-only mini form.
  const [scanType, setScanType] = useState<"treatment" | "retention">(
    "treatment"
  );
  const [retentionScanner, setRetentionScanner] = useState<ScannerType | "">("");
  const [hasExistingScan, setHasExistingScan] = useState(false);
  const [creatingRetention, setCreatingRetention] = useState(false);
  const [retentionError, setRetentionError] = useState("");
  const [showFinalize, setShowFinalize] = useState(false);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadData() {
    // Load patient info
    const { data: patientData } = await supabase
      .from("patients")
      .select("id, dni, first_name, last_name, lab_id, treatment_status, created_at")
      .eq("id", patientId)
      .single();

    if (patientData) setPatient(patientData as Patient);

    // If viewing/completing existing scan, load form data
    if (scanId && isView) {
      const { data: formData } = await supabase
        .from("clinical_forms")
        .select("*")
        .eq("scan_id", scanId)
        .single();

      if (formData) {
        const form = formData as ClinicalFormType;
        setExistingForm(form);

        // Get signed URLs for all 9 photo fields
        const urls = emptyUrls();
        await Promise.all(
          PHOTO_KEYS.map(async (key) => {
            const path = (form as unknown as Record<string, string | null>)[
              key
            ];
            if (!path) return;
            const { data } = await supabase.storage
              .from("clinical-images")
              .createSignedUrl(path, 3600);
            if (data) urls[key] = data.signedUrl;
          })
        );
        setExistingImageUrls(urls);
      }
    }

    // For a new scan, pre-select the scanner used in the lab's most recent
    // scan (RLS scopes this to the logged-in lab's own scans). null = no
    // history → the dentist must choose before submitting.
    if (isNew) {
      const { data: lastScan } = await supabase
        .from("scans")
        .select("scanner")
        .not("scanner", "is", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastScan?.scanner) {
        setDefaultScanner(lastScan.scanner as ScannerType);
        setRetentionScanner(lastScan.scanner as ScannerType);
      }

      // A contención (retention) can never be the patient's first scan — the
      // first scan_number must be a treatment scan (contract invariant). Only
      // offer Modo A when the patient already has at least one scan.
      const { count } = await supabase
        .from("scans")
        .select("id", { count: "exact", head: true })
        .eq("patient_id", patientId);
      setHasExistingScan((count ?? 0) > 0);
    }

    setPageLoading(false);
  }

  async function uploadImage(
    file: File,
    patId: number,
    scId: number,
    tipo: PhotoKey
  ): Promise<string | null> {
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${patId}/${scId}/${tipo}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("clinical-images")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      console.error(`Upload error for ${tipo}:`, uploadError);
      return null;
    }
    return path;
  }

  async function handleSubmit(data: ClinicalFormData) {
    setError("");
    setSubmitLoading(true);

    let targetScanId = scanId;

    // Step 1: Create scan if mode=new
    if (isNew) {
      const { data: nextNum, error: rpcError } = await supabase.rpc(
        "get_next_scan_number",
        { p_patient_id: patientId }
      );

      if (rpcError || nextNum === null) {
        setError("Error al obtener el número de escaneo.");
        setSubmitLoading(false);
        return;
      }

      const { data: newScan, error: scanError } = await supabase
        .from("scans")
        .insert({
          patient_id: patientId,
          scan_number: nextNum,
          origin: "web",
          scanner: data.scanner,
        })
        .select("id")
        .single();

      if (scanError || !newScan) {
        setError("Error al crear el escaneo. Intentá de nuevo.");
        setSubmitLoading(false);
        return;
      }

      targetScanId = newScan.id;
    }

    if (!targetScanId) {
      setError("Error: no se pudo determinar el escaneo.");
      setSubmitLoading(false);
      return;
    }

    // Step 2: Upload all photos in parallel
    const uploadEntries = await Promise.all(
      PHOTO_KEYS.map(async (key) => {
        const file = data.photos[key];
        if (!file) return [key, null] as const;
        const path = await uploadImage(file, patientId, targetScanId!, key);
        return [key, path] as const;
      })
    );

    // Step 3: Create clinical_form
    const formPayload: Record<string, unknown> = {
      scan_id: targetScanId,
      notes: data.notes.trim() || null,
    };

    for (const [key, path] of uploadEntries) {
      formPayload[key] = path;
    }

    for (const [key, value] of Object.entries(data.checkboxes)) {
      formPayload[key] = value;
    }

    const { error: formError } = await supabase
      .from("clinical_forms")
      .insert(formPayload);

    if (formError) {
      if (isNew) {
        setError(
          "El escaneo se creó correctamente pero hubo un error al guardar el formulario. Podés completarlo desde la vista del paciente."
        );
      } else {
        setError("Error al guardar el formulario. Intentá de nuevo.");
      }
      setSubmitLoading(false);
      return;
    }

    // Success — redirect back
    router.push("/");
    router.refresh();
  }

  // Modo A: create a retention scan (no clinical form), then ask about finishing.
  async function handleCreateRetention() {
    if (!hasExistingScan) {
      setRetentionError(
        "Una contención no puede ser el primer escaneo del paciente."
      );
      return;
    }
    if (!retentionScanner) {
      setRetentionError("Elegí con qué escáner se hizo el escaneo.");
      return;
    }
    setRetentionError("");
    setCreatingRetention(true);

    const { data: nextNum, error: rpcError } = await supabase.rpc(
      "get_next_scan_number",
      { p_patient_id: patientId }
    );

    if (rpcError || nextNum === null) {
      setRetentionError("Error al obtener el número de escaneo.");
      setCreatingRetention(false);
      return;
    }

    const { error: scanError } = await supabase.from("scans").insert({
      patient_id: patientId,
      scan_number: nextNum,
      origin: "web",
      scanner: retentionScanner,
      scan_type: "retention",
      retention_mode: "with_scan",
      retention_status: "pending",
    });

    setCreatingRetention(false);

    if (scanError) {
      setRetentionError("Error al crear la contención. Intentá de nuevo.");
      return;
    }

    // Contenciones no llevan formulario clínico. Preguntar si finaliza.
    setShowFinalize(true);
  }

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner className="text-blue-500" />
        <span className="ml-2 text-sm text-text-muted">Cargando...</span>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-text-primary">
          {isView
            ? "Formulario clínico"
            : !isNew
              ? "Completar formulario clínico"
              : scanType === "retention"
                ? "Nueva contención"
                : "Nuevo escaneo — Formulario clínico"}
        </h1>
        {patient && (
          <p className="mt-1 text-sm text-text-muted">
            {patient.last_name}, {patient.first_name} — DNI: {patient.dni}
          </p>
        )}
      </div>

      {/* Type toggle (only when creating a new scan, and only if the patient
          already has a scan — a contención can't be the first scan) */}
      {isNew && hasExistingScan && (
        <div>
          <p className="block text-sm font-semibold text-text-primary">
            Tipo de escaneo
          </p>
          <div className="mt-1.5 flex gap-2">
            <button
              type="button"
              onClick={() => setScanType("treatment")}
              className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                scanType === "treatment"
                  ? "border-blue-500 bg-blue-600/20 text-blue-400 font-medium"
                  : "border-border bg-surface text-text-secondary hover:bg-surface-hover"
              }`}
            >
              Tratamiento
            </button>
            <button
              type="button"
              onClick={() => setScanType("retention")}
              className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                scanType === "retention"
                  ? "border-blue-500 bg-blue-600/20 text-blue-400 font-medium"
                  : "border-border bg-surface text-text-secondary hover:bg-surface-hover"
              }`}
            >
              Contención
            </button>
          </div>
        </div>
      )}

      {/* Form (treatment) or retention mini-form (Modo A) */}
      {isNew && scanType === "retention" ? (
        <div className="space-y-4">
          <p className="text-sm text-text-muted">
            La contención se crea como un escaneo nuevo, sin formulario clínico.
            Indicá con qué escáner vas a escanear al paciente.
          </p>
          <ScannerSelect
            value={retentionScanner}
            onChange={setRetentionScanner}
          />
          {retentionError && (
            <div className="rounded-lg bg-error-bg px-3 py-2 text-sm text-error-text">
              {retentionError}
            </div>
          )}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleCreateRetention}
              disabled={creatingRetention}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {creatingRetention && <Spinner />}
              {creatingRetention ? "Creando..." : "Crear contención"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="rounded-lg border border-border px-5 py-2.5 text-sm text-text-secondary hover:bg-surface-hover transition-colors"
            >
              Volver
            </button>
          </div>
        </div>
      ) : (
        <ClinicalForm
          readOnly={isView}
          existingData={existingForm}
          existingImageUrls={existingImageUrls}
          loading={submitLoading}
          error={error}
          showScanner={isNew}
          defaultScanner={defaultScanner}
          onSubmit={handleSubmit}
          onCancel={() => router.push("/")}
        />
      )}

      {/* Finalize treatment prompt (after creating a retention) */}
      <FinalizeTreatmentModal
        patientId={patientId}
        open={showFinalize}
        title="Contención solicitada"
        onResolved={() => {
          setShowFinalize(false);
          router.push("/");
          router.refresh();
        }}
      />
    </div>
  );
}
