"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Modal from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";

interface FinalizeTreatmentModalProps {
  patientId: number;
  open: boolean;
  /** Modal heading. Defaults to a neutral "Finalizar tratamiento"; the
   * retention call sites pass "Contención solicitada". */
  title?: string;
  /** Called after the user answers. `closed` = true if the treatment was
   * marked as finished (treatment_status set to 'closed'); false if they
   * chose to keep it active. */
  onResolved: (closed: boolean) => void;
}

/** "¿Desea finalizar el tratamiento?" prompt shown after requesting a
 * retention (Modo A/B) and reused by the standalone finalize button. On "Sí"
 * it writes patients.treatment_status='closed'; on "No" it writes nothing. */
export default function FinalizeTreatmentModal({
  patientId,
  open,
  title = "Finalizar tratamiento",
  onResolved,
}: FinalizeTreatmentModalProps) {
  const supabase = createClient();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Clear any prior submit state every time the prompt is reopened.
  useEffect(() => {
    if (open) {
      setSubmitting(false);
      setError("");
    }
  }, [open]);

  async function finalize() {
    setSubmitting(true);
    setError("");

    const { error: updateError } = await supabase
      .from("patients")
      .update({ treatment_status: "closed" })
      .eq("id", patientId);

    setSubmitting(false);

    if (updateError) {
      setError("Error al finalizar el tratamiento. Intentá de nuevo.");
      return;
    }

    onResolved(true);
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!submitting) onResolved(false);
      }}
      title={title}
    >
      <div className="space-y-4">
        <p className="text-sm text-text-primary">
          ¿Desea finalizar el tratamiento del paciente?
        </p>
        <p className="text-sm text-text-muted">
          Podés reabrirlo más adelante desde la vista del paciente.
        </p>

        {error && (
          <div className="rounded-lg bg-error-bg px-3 py-2 text-sm text-error-text">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => onResolved(false)}
            disabled={submitting}
            className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary hover:bg-surface-hover disabled:opacity-50 transition-colors"
          >
            No, seguir activo
          </button>
          <button
            type="button"
            onClick={finalize}
            disabled={submitting}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting && <Spinner />}
            {submitting ? "Finalizando..." : "Sí, finalizar"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
