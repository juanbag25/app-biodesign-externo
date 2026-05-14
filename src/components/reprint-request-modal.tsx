"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Modal from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";
import { formatAligners } from "@/lib/reprint-utils";
import type { ScanWithForm, ReprintAligner } from "@/lib/types";

interface ReprintRequestModalProps {
  scan: ScanWithForm;
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

type Step = "select" | "confirm";

function keyOf(arch: "upper" | "lower", number: number) {
  return `${arch}-${number}`;
}

function parseKey(key: string): ReprintAligner {
  const [arch, number] = key.split("-");
  return { arch: arch as "upper" | "lower", number: Number(number) };
}

export default function ReprintRequestModal({
  scan,
  open,
  onClose,
  onCreated,
}: ReprintRequestModalProps) {
  const supabase = createClient();

  const [step, setStep] = useState<Step>("select");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Reset state every time the modal opens
  useEffect(() => {
    if (open) {
      setStep("select");
      setSelected(new Set());
      setSubmitting(false);
      setError("");
    }
  }, [open]);

  const upperCount = scan.upper_aligners_count ?? 0;
  const lowerCount = scan.lower_aligners_count ?? 0;
  const upperNumbers = Array.from({ length: upperCount }, (_, i) => i + 1);
  const lowerNumbers = Array.from({ length: lowerCount }, (_, i) => i + 1);

  function toggle(arch: "upper" | "lower", number: number) {
    const key = keyOf(arch, number);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const selectedAligners: ReprintAligner[] = Array.from(selected).map(parseKey);

  async function handleConfirm() {
    setSubmitting(true);
    setError("");

    const { error: insertError } = await supabase
      .from("reprint_requests")
      .insert({
        scan_id: scan.id,
        aligners: selectedAligners,
        status: "pending",
      });

    if (insertError) {
      setError("Error al crear la solicitud. Intentá de nuevo.");
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    onCreated();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Solicitar reimpresión">
      {step === "select" ? (
        <div className="space-y-4">
          <p className="text-sm text-text-muted">
            Seleccioná los alineadores que necesitás reimprimir.
          </p>

          {upperNumbers.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-text-muted">
                Superiores
              </p>
              <div className="flex flex-wrap gap-2">
                {upperNumbers.map((n) => {
                  const active = selected.has(keyOf("upper", n));
                  return (
                    <button
                      key={`upper-${n}`}
                      type="button"
                      onClick={() => toggle("upper", n)}
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
          )}

          {lowerNumbers.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-text-muted">
                Inferiores
              </p>
              <div className="flex flex-wrap gap-2">
                {lowerNumbers.map((n) => {
                  const active = selected.has(keyOf("lower", n));
                  return (
                    <button
                      key={`lower-${n}`}
                      type="button"
                      onClick={() => toggle("lower", n)}
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
          )}

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
              disabled={selected.size === 0}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Continuar
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-text-primary">
            Vas a solicitar la reimpresión de:
          </p>
          <p className="rounded-lg bg-surface-hover px-3 py-2 text-sm font-medium text-text-primary">
            {formatAligners(selectedAligners)}
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
              {submitting ? "Solicitando..." : "Confirmar solicitud"}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
