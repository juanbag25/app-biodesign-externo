"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Spinner } from "@/components/ui/spinner";
import { formatAligners } from "@/lib/reprint-utils";
import type {
  ScanWithForm,
  ReprintRequest,
  RetentionStatus,
} from "@/lib/types";

interface RetentionsSectionProps {
  /** The patient's scans (Modo A retentions live here; also used to map a
   * Modo B request's origin scan_id → scan_number). */
  scans: ScanWithForm[];
  /** Bump to reload Modo B requests (e.g. after creating one). */
  refreshKey: number;
  /** Called after a Modo A retention is applied, so the parent reloads scans. */
  onChanged: () => void;
}

const STATUS_LABEL: Record<RetentionStatus, string> = {
  pending: "Solicitada",
  completed: "Producida",
  applied: "Aplicada",
};

function statusBadgeClass(status: RetentionStatus): string {
  if (status === "pending")
    return "bg-amber-500/15 text-amber-600 dark:text-amber-400";
  if (status === "completed") return "bg-blue-600/15 text-blue-500";
  return "bg-success-bg text-success-text"; // applied
}

export default function RetentionsSection({
  scans,
  refreshKey,
  onChanged,
}: RetentionsSectionProps) {
  const supabase = createClient();

  const [modoB, setModoB] = useState<ReprintRequest[]>([]);
  const [applyingKey, setApplyingKey] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Modo A retentions ARE scans (scan_type='retention').
  const modoA = scans.filter((s) => s.scan_type === "retention");
  const scanNumberById = new Map(scans.map((s) => [s.id, s.scan_number]));
  const scanIdsKey = scans.map((s) => s.id).join(",");

  async function loadModoB() {
    const ids = scans.map((s) => s.id);
    if (ids.length === 0) {
      setModoB([]);
      return;
    }
    const { data } = await supabase
      .from("reprint_requests")
      .select(
        "id, scan_id, request_type, aligners, status, requested_at, completed_at, applied_at"
      )
      .eq("request_type", "retention")
      .in("scan_id", ids)
      .order("requested_at", { ascending: false });

    setModoB((data ?? []) as ReprintRequest[]);
  }

  useEffect(() => {
    loadModoB();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanIdsKey, refreshKey]);

  async function applyModoA(scanId: number) {
    setApplyingKey(`A-${scanId}`);
    setError("");

    const { error: err } = await supabase
      .from("scans")
      .update({
        retention_status: "applied",
        retention_applied_at: new Date().toISOString(),
      })
      .eq("id", scanId);

    setApplyingKey(null);

    if (err) {
      setError("Error al marcar como aplicada. Intentá de nuevo.");
      return;
    }
    onChanged(); // parent reloads scans → Modo A status refreshes here
  }

  async function applyModoB(id: number) {
    setApplyingKey(`B-${id}`);
    setError("");

    const { error: err } = await supabase
      .from("reprint_requests")
      .update({
        status: "applied",
        applied_at: new Date().toISOString(),
      })
      .eq("id", id);

    setApplyingKey(null);

    if (err) {
      setError("Error al marcar como aplicada. Intentá de nuevo.");
      return;
    }
    loadModoB();
  }

  const hasAny = modoA.length > 0 || modoB.length > 0;
  if (!hasAny) return null;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-text-secondary">Contenciones</p>

      {error && (
        <div className="rounded-lg bg-error-bg px-3 py-2 text-sm text-error-text">
          {error}
        </div>
      )}

      <div className="space-y-2">
        {modoA.map((s) => {
          const status = (s.retention_status ?? "pending") as RetentionStatus;
          return (
            <RetentionRow
              key={`A-${s.id}`}
              title={`Escaneo ${s.scan_number} (contención)`}
              detail="Contención con escaneo"
              status={status}
              applying={applyingKey === `A-${s.id}`}
              onApply={() => applyModoA(s.id)}
            />
          );
        })}

        {modoB.map((r) => {
          const originNumber = scanNumberById.get(r.scan_id);
          return (
            <RetentionRow
              key={`B-${r.id}`}
              title="Contención"
              detail={`${formatAligners(r.aligners)}${
                originNumber != null
                  ? ` · a partir del escaneo ${originNumber}`
                  : ""
              }`}
              status={r.status}
              applying={applyingKey === `B-${r.id}`}
              onApply={() => applyModoB(r.id)}
            />
          );
        })}
      </div>
    </div>
  );
}

function RetentionRow({
  title,
  detail,
  status,
  applying,
  onApply,
}: {
  title: string;
  detail: string;
  status: RetentionStatus;
  applying: boolean;
  onApply: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(
                status
              )}`}
            >
              {STATUS_LABEL[status]}
            </span>
            <span className="text-sm font-medium text-text-primary">
              {title}
            </span>
          </div>
          <p className="text-sm text-text-secondary">{detail}</p>
        </div>

        {status === "completed" && (
          <button
            type="button"
            onClick={onApply}
            disabled={applying}
            className="flex shrink-0 items-center gap-1 rounded-lg border border-blue-600 px-3 py-1.5 text-xs font-semibold text-blue-500 hover:bg-blue-950/20 active:bg-blue-950/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {applying && <Spinner className="text-blue-500" />}
            Marcar aplicada
          </button>
        )}
      </div>
    </div>
  );
}
