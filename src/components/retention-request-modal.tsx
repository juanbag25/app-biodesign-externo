"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Modal from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";
import type { ScanWithForm, RetentionSourceAligner } from "@/lib/types";

interface RetentionRequestModalProps {
  /** Treatment scan whose aligners are offered as the retention source. */
  scan: ScanWithForm;
  patientId: number;
  open: boolean;
  onClose: () => void;
  /** Called after the retention scan row is created successfully. */
  onCreated: () => void;
}

type Step = "select" | "confirm";
type Arch = "upper" | "lower";

function keyOf(arch: Arch, number: number) {
  return `${arch}-${number}`;
}

function archLabel(arch: Arch) {
  return arch === "upper" ? "Superior" : "Inferior";
}

export default function RetentionRequestModal({
  scan,
  patientId,
  open,
  onClose,
  onCreated,
}: RetentionRequestModalProps) {
  const supabase = createClient();

  const [step, setStep] = useState<Step>("select");
  const [selected, setSelected] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Reset state every time the modal opens
  useEffect(() => {
    if (open) {
      setStep("select");
      setSelected(null);
      setSubmitting(false);
      setError("");
    }
  }, [open]);

  // Files on disk are 0-indexed (maxilla_0..maxilla_N-1, mandible_0..mandible_N-1).
  // count is the TOTAL number of files; valid aligner indices are 0..count-1.
  const upperCount = scan.upper_aligners_count ?? 0;
  const lowerCount = scan.lower_aligners_count ?? 0;
  const upperNumbers = Array.from({ length: upperCount }, (_, i) => i);
  const lowerNumbers = Array.from({ length: lowerCount }, (_, i) => i);

  const sourceAligner: RetentionSourceAligner | null = selected
    ? (() => {
        const [arch, number] = selected.split("-");
        return {
          scan_number: scan.scan_number,
          arch: arch as Arch,
          number: Number(number),
        };
      })()
    : null;

  async function handleConfirm() {
    if (!sourceAligner) return;
    setSubmitting(true);
    setError("");

    const { data: nextNum, error: rpcError } = await supabase.rpc(
      "get_next_scan_number",
      { p_patient_id: patientId }
    );

    if (rpcError || nextNum === null) {
      setError("Error al obtener el número de escaneo.");
      setSubmitting(false);
      return;
    }

    const { error: insertError } = await supabase.from("scans").insert({
      patient_id: patientId,
      scan_number: nextNum,
      origin: "web",
      scan_type: "retention",
      retention_mode: "from_aligner",
      retention_status: "pending",
      retention_source_aligner: sourceAligner,
    });

    if (insertError) {
      setError("Error al crear la contención. Intentá de nuevo.");
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    onCreated();
  }

  function renderArch(arch: Arch, numbers: number[]) {
    if (numbers.length === 0) return null;
    return (
      <div>
        <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-text-muted">
          {arch === "upper" ? "Superiores" : "Inferiores"}
        </p>
        <div className="flex flex-wrap gap-2">
          {numbers.map((n) => {
            const active = selected === keyOf(arch, n);
            return (
              <button
                key={`${arch}-${n}`}
                type="button"
                onClick={() => setSelected(keyOf(arch, n))}
                className={`rounded-lg border px-3 py-1.5 text-sm tabular-nums transition-colors ${
                  active
                    ? "border-blue-500 bg-blue-600/20 text-blue-400 font-medium"
                    : "border-border bg-surface text-text-secondary hover:bg-surface-hover"
                }`}
              >
                {n}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <Modal
      open={open}
      onClose={submitting ? () => {} : onClose}
      title="Solicitar contención"
    >
      {step === "select" ? (
        <div className="space-y-4">
          <p className="text-sm text-text-muted">
            Elegí el alineador a partir del cual fabricar la placa de contención
            (idealmente el último puesto en boca).
          </p>

          {renderArch("upper", upperNumbers)}
          {renderArch("lower", lowerNumbers)}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary hover:bg-surface-hover transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => setStep("confirm")}
              disabled={!selected}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Continuar
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-text-primary">
            Vas a solicitar una contención a partir del alineador:
          </p>
          <p className="rounded-lg bg-surface-hover px-3 py-2 text-sm font-medium text-text-primary">
            {sourceAligner
              ? `${archLabel(sourceAligner.arch)} ${sourceAligner.number} (escaneo ${sourceAligner.scan_number})`
              : ""}
          </p>
          <p className="text-sm text-text-muted">¿Estás seguro?</p>

          {error && (
            <div className="rounded-lg bg-error-bg px-3 py-2 text-sm text-error-text">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setStep("select")}
              disabled={submitting}
              className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary hover:bg-surface-hover disabled:opacity-50 transition-colors"
            >
              Volver
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={submitting}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting && <Spinner />}
              {submitting ? "Solicitando..." : "Confirmar contención"}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
