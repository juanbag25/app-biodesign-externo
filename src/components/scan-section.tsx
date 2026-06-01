"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Spinner, CheckIcon } from "@/components/ui/spinner";
import ReprintRequestModal from "@/components/reprint-request-modal";
import ReprintRequestsList from "@/components/reprint-requests-list";
import type { Patient, ScanWithForm } from "@/lib/types";

interface ScanSectionProps {
  patient: Patient;
}

export default function ScanSection({ patient }: ScanSectionProps) {
  const supabase = createClient();
  const router = useRouter();

  const [scans, setScans] = useState<ScanWithForm[]>([]);
  const [selectedScan, setSelectedScan] = useState<ScanWithForm | null>(null);
  const [loading, setLoading] = useState(true);

  const [savingField, setSavingField] = useState<string | null>(null);
  const [savedField, setSavedField] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const [reprintModalOpen, setReprintModalOpen] = useState(false);
  const [reprintRefreshKey, setReprintRefreshKey] = useState(0);

  useEffect(() => {
    loadScans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient.id]);

  async function loadScans() {
    setLoading(true);
    setSelectedScan(null);

    // Fetch scans
    const { data: scanData } = await supabase
      .from("scans")
      .select(
        "id, patient_id, scan_number, case_number, lab_name, download_date, origin, phase, is_phase_start, upper_aligners_count, lower_aligners_count, upper_stage, lower_stage, created_at"
      )
      .eq("patient_id", patient.id)
      .order("scan_number", { ascending: false });

    const scanList = (scanData ?? []) as ScanWithForm[];

    // Fetch which scans have clinical forms
    if (scanList.length > 0) {
      const scanIds = scanList.map((s) => s.id);
      const { data: formData } = await supabase
        .from("clinical_forms")
        .select("scan_id")
        .in("scan_id", scanIds);

      const formScanIds = new Set((formData ?? []).map((f) => f.scan_id));
      scanList.forEach((s) => {
        s.has_clinical_form = formScanIds.has(s.id);
      });
    }

    setScans(scanList);
    if (scanList.length > 0) {
      setSelectedScan(scanList[0]);
    }
    setLoading(false);
  }

  async function updateStage(
    field: "upper_stage" | "lower_stage",
    value: number
  ) {
    if (!selectedScan) return;

    setSavingField(field);
    setSavedField(null);
    setUpdateError(null);

    const { error } = await supabase
      .from("scans")
      .update({ [field]: value })
      .eq("id", selectedScan.id);

    if (error) {
      setUpdateError("Error al guardar. Intentá de nuevo.");
      setSavingField(null);
      return;
    }

    setSelectedScan({ ...selectedScan, [field]: value });
    setScans((prev) =>
      prev.map((s) =>
        s.id === selectedScan.id ? { ...s, [field]: value } : s
      )
    );
    setSavingField(null);
    setSavedField(field);
    setTimeout(() => setSavedField(null), 2000);
  }

  function handleScanChange(scanId: number) {
    const scan = scans.find((s) => s.id === scanId);
    if (scan) {
      setSelectedScan(scan);
      setUpdateError(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-8 justify-center">
        <Spinner className="text-blue-500" />
        <span className="text-sm text-text-muted">Cargando escaneos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() =>
            router.push(
              `/formulario-clinico?patient_id=${patient.id}&mode=new`
            )
          }
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 active:bg-blue-700 transition-colors"
        >
          {scans.length === 0 ? "Escanear" : "Reescanear"}
        </button>

        {selectedScan && !selectedScan.has_clinical_form && (
          <button
            onClick={() =>
              router.push(
                `/formulario-clinico?patient_id=${patient.id}&scan_id=${selectedScan.id}`
              )
            }
            className="rounded-lg border border-blue-600 px-4 py-2 text-sm font-semibold text-blue-500 hover:bg-blue-950/20 active:bg-blue-950/30 transition-colors"
          >
            Completar formulario
          </button>
        )}

        {selectedScan && selectedScan.has_clinical_form && (
          <button
            onClick={() =>
              router.push(
                `/formulario-clinico?patient_id=${patient.id}&scan_id=${selectedScan.id}&view=true`
              )
            }
            className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary hover:bg-surface-hover transition-colors"
          >
            Ver formulario
          </button>
        )}

        {selectedScan && (
          <button
            onClick={() => setReprintModalOpen(true)}
            disabled={!scanHasAligners(selectedScan)}
            title={
              scanHasAligners(selectedScan)
                ? undefined
                : "El escaneo todavía no tiene alineadores"
            }
            className="rounded-lg border border-blue-600 px-4 py-2 text-sm font-semibold text-blue-500 hover:bg-blue-950/20 active:bg-blue-950/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Solicitar reimpresión
          </button>
        )}
      </div>

      {scans.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface px-4 py-8 text-center">
          <p className="text-sm text-text-muted">
            Este paciente no tiene escaneos.
          </p>
        </div>
      ) : (
        <>
          {/* Scan selector */}
          <div>
            <label
              htmlFor="scan-select"
              className="block text-sm font-medium text-text-secondary"
            >
              Escaneo
            </label>
            <select
              id="scan-select"
              value={selectedScan?.id ?? ""}
              onChange={(e) => handleScanChange(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-text-primary focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none sm:w-52"
            >
              {scans.map((s) => (
                <option key={s.id} value={s.id}>
                  {formatScanLabel(s)}
                </option>
              ))}
            </select>
          </div>

          {/* Scan details */}
          {selectedScan && (
            <div className="rounded-xl border border-border bg-surface">
              {/* Aligner counts */}
              <div className="grid grid-cols-2 divide-x divide-border-subtle border-b border-border-subtle">
                <AlignerCount
                  label="Superiores"
                  count={selectedScan.upper_aligners_count}
                  stage={selectedScan.upper_stage}
                />
                <AlignerCount
                  label="Inferiores"
                  count={selectedScan.lower_aligners_count}
                  stage={selectedScan.lower_stage}
                />
              </div>

              {/* Stage dropdowns */}
              <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-5">
                <StageDropdown
                  label="Último superior colocado"
                  field="upper_stage"
                  value={selectedScan.upper_stage}
                  max={selectedScan.upper_aligners_count}
                  saving={savingField === "upper_stage"}
                  saved={savedField === "upper_stage"}
                  onChange={(v) => updateStage("upper_stage", v)}
                />
                <StageDropdown
                  label="Último inferior colocado"
                  field="lower_stage"
                  value={selectedScan.lower_stage}
                  max={selectedScan.lower_aligners_count}
                  saving={savingField === "lower_stage"}
                  saved={savedField === "lower_stage"}
                  onChange={(v) => updateStage("lower_stage", v)}
                />
              </div>

              {updateError && (
                <div className="border-t border-border-subtle px-4 py-3 sm:px-5">
                  <p className="text-sm text-error-text">{updateError}</p>
                </div>
              )}
            </div>
          )}

          {/* Reprint requests list */}
          {selectedScan && (
            <ReprintRequestsList
              scanId={selectedScan.id}
              refreshKey={reprintRefreshKey}
            />
          )}
        </>
      )}

      {/* Reprint request modal */}
      {selectedScan && (
        <ReprintRequestModal
          scan={selectedScan}
          open={reprintModalOpen}
          onClose={() => setReprintModalOpen(false)}
          onCreated={() => setReprintRefreshKey((k) => k + 1)}
        />
      )}
    </div>
  );
}

function scanHasAligners(scan: ScanWithForm): boolean {
  return (
    (scan.upper_aligners_count ?? 0) > 0 ||
    (scan.lower_aligners_count ?? 0) > 0
  );
}

function formatScanLabel(scan: ScanWithForm): string {
  if (scan.phase != null) {
    return `Escaneo ${scan.scan_number} (fase ${scan.phase})`;
  }
  return `Escaneo ${scan.scan_number}`;
}

function AlignerCount({
  label,
  count,
  stage,
}: {
  label: string;
  count: number | null;
  stage: number;
}) {
  const pending = count === null;

  return (
    <div className="px-4 py-4 sm:px-5">
      <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
        {label}
      </p>
      {pending ? (
        <p className="mt-1 text-sm italic text-text-muted">
          Pendiente de alineación
        </p>
      ) : (
        <>
          <p className="mt-1 text-2xl font-bold tabular-nums text-text-primary">
            {count}
          </p>
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs text-text-muted">
              <span>
                Etapa {stage}/{count}
              </span>
              <span>
                {count > 0 ? Math.round((stage / count) * 100) : 0}%
              </span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-progress-bg">
              <div
                className="h-full rounded-full bg-blue-500 transition-all duration-300"
                style={{
                  width: `${count > 0 ? (stage / count) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StageDropdown({
  label,
  field,
  value,
  max,
  saving,
  saved,
  onChange,
}: {
  label: string;
  field: string;
  value: number;
  max: number | null;
  saving: boolean;
  saved: boolean;
  onChange: (value: number) => void;
}) {
  const disabled = max === null;
  const options = disabled
    ? []
    : Array.from({ length: max + 1 }, (_, i) => i);

  return (
    <div>
      <label
        htmlFor={field}
        className="block text-sm font-medium text-text-secondary"
      >
        {label}
      </label>
      {disabled ? (
        <p className="mt-1.5 text-sm italic text-text-muted">
          Pendiente de alineación
        </p>
      ) : (
        <div className="mt-1.5 flex items-center gap-2">
          <select
            id={field}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            disabled={saving}
            className="w-full rounded-lg border border-border bg-input-bg px-3 py-2.5 text-sm tabular-nums text-text-primary focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:opacity-50 sm:w-28"
          >
            {options.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          {saving && (
            <span className="flex items-center gap-1 text-xs text-text-muted">
              <Spinner className="text-text-muted" />
              Guardando
            </span>
          )}
          {saved && (
            <span className="flex items-center gap-1 text-xs font-medium text-success-text">
              <CheckIcon />
              Guardado
            </span>
          )}
        </div>
      )}
    </div>
  );
}
