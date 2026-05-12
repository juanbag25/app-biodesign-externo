"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ClinicalForm, { type ClinicalFormData } from "@/components/clinical-form";
import { Spinner } from "@/components/ui/spinner";
import type { ClinicalForm as ClinicalFormType, Patient } from "@/lib/types";

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
  const [existingImageUrls, setExistingImageUrls] = useState<{
    profile: string | null;
    front: string | null;
    xray: string | null;
  }>({ profile: null, front: null, xray: null });
  const [pageLoading, setPageLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadData() {
    // Load patient info
    const { data: patientData } = await supabase
      .from("patients")
      .select("id, dni, first_name, last_name, lab_id, created_at")
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

        // Get signed URLs for images
        const urls = { profile: null as string | null, front: null as string | null, xray: null as string | null };
        for (const [key, path] of Object.entries({
          profile: form.photo_profile,
          front: form.photo_front,
          xray: form.xray_image,
        })) {
          if (path) {
            const { data } = await supabase.storage
              .from("clinical-images")
              .createSignedUrl(path, 3600);
            if (data) urls[key as keyof typeof urls] = data.signedUrl;
          }
        }
        setExistingImageUrls(urls);
      }
    }

    setPageLoading(false);
  }

  async function uploadImage(
    file: File,
    patId: number,
    scId: number,
    tipo: string
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
      // Get next scan number via RPC
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

    // Step 2: Upload images in parallel
    const [profilePath, frontPath, xrayPath] = await Promise.all([
      data.photoProfile
        ? uploadImage(data.photoProfile, patientId, targetScanId, "profile")
        : Promise.resolve(null),
      data.photoFront
        ? uploadImage(data.photoFront, patientId, targetScanId, "front")
        : Promise.resolve(null),
      data.xrayImage
        ? uploadImage(data.xrayImage, patientId, targetScanId, "xray")
        : Promise.resolve(null),
    ]);

    // Step 3: Create clinical_form
    const formPayload: Record<string, unknown> = {
      scan_id: targetScanId,
      notes: data.notes.trim() || null,
      photo_profile: profilePath,
      photo_front: frontPath,
      xray_image: xrayPath,
    };

    // Add checkbox values
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
            : isNew
              ? "Nuevo escaneo — Formulario clínico"
              : "Completar formulario clínico"}
        </h1>
        {patient && (
          <p className="mt-1 text-sm text-text-muted">
            {patient.last_name}, {patient.first_name} — DNI: {patient.dni}
          </p>
        )}
      </div>

      {/* Form */}
      <ClinicalForm
        readOnly={isView}
        existingData={existingForm}
        existingImageUrls={existingImageUrls}
        loading={submitLoading}
        error={error}
        onSubmit={handleSubmit}
        onCancel={() => router.push("/")}
      />
    </div>
  );
}
