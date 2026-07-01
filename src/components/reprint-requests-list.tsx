"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Spinner } from "@/components/ui/spinner";
import { formatAligners } from "@/lib/reprint-utils";
import type { ReprintRequest } from "@/lib/types";

interface ReprintRequestsListProps {
  scanId: number;
  refreshKey: number;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ReprintRequestsList({
  scanId,
  refreshKey,
}: ReprintRequestsListProps) {
  const supabase = createClient();

  const [requests, setRequests] = useState<ReprintRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [cancelingId, setCancelingId] = useState<number | null>(null);
  const [notice, setNotice] = useState<{
    type: "info" | "error";
    text: string;
  } | null>(null);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("reprint_requests")
      .select(
        "id, scan_id, request_type, aligners, status, requested_at, completed_at, applied_at"
      )
      .eq("scan_id", scanId)
      .eq("request_type", "reprint")
      .order("requested_at", { ascending: false });

    setRequests((data ?? []) as ReprintRequest[]);
    setLoading(false);
  }

  useEffect(() => {
    setConfirmingId(null);
    setNotice(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanId, refreshKey]);

  async function handleCancel(id: number) {
    setCancelingId(id);
    setNotice(null);

    const { data, error } = await supabase
      .from("reprint_requests")
      .delete()
      .eq("id", id)
      .select();

    setCancelingId(null);
    setConfirmingId(null);

    if (error) {
      setNotice({
        type: "error",
        text: "Error al cancelar la solicitud. Intentá de nuevo.",
      });
      return;
    }

    if (!data || data.length === 0) {
      // RLS blocked the delete: the lab already marked it as completed
      setNotice({
        type: "info",
        text: "Esta solicitud ya fue procesada.",
      });
      load();
      return;
    }

    load();
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-1 py-2">
        <Spinner className="text-blue-500" />
        <span className="text-sm text-text-muted">Cargando solicitudes...</span>
      </div>
    );
  }

  if (requests.length === 0 && !notice) {
    return null;
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-text-secondary">
        Solicitudes de reimpresión
      </p>

      {notice && (
        <div
          className={`rounded-lg px-3 py-2 text-sm ${
            notice.type === "error"
              ? "bg-error-bg text-error-text"
              : "bg-surface-hover text-text-secondary"
          }`}
        >
          {notice.text}
        </div>
      )}

      {requests.map((req) => {
        const pending = req.status === "pending";
        return (
          <div
            key={req.id}
            className="rounded-xl border border-border bg-surface p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      pending
                        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                        : "bg-success-bg text-success-text"
                    }`}
                  >
                    {pending ? "Pendiente" : "Completada"}
                  </span>
                  <span className="text-xs text-text-muted">
                    {formatDate(req.requested_at)}
                  </span>
                </div>
                <p className="text-sm text-text-primary">
                  {formatAligners(req.aligners)}
                </p>
              </div>

              {pending &&
                (confirmingId === req.id ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-muted">¿Cancelar?</span>
                    <button
                      onClick={() => handleCancel(req.id)}
                      disabled={cancelingId === req.id}
                      className="flex items-center gap-1 rounded-lg bg-error-bg px-2.5 py-1 text-xs font-medium text-error-text hover:opacity-80 disabled:opacity-50 transition-opacity"
                    >
                      {cancelingId === req.id && (
                        <Spinner className="text-error-text" />
                      )}
                      Sí
                    </button>
                    <button
                      onClick={() => setConfirmingId(null)}
                      disabled={cancelingId === req.id}
                      className="rounded-lg border border-border px-2.5 py-1 text-xs text-text-secondary hover:bg-surface-hover disabled:opacity-50 transition-colors"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setConfirmingId(req.id);
                      setNotice(null);
                    }}
                    className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
                  >
                    Cancelar solicitud
                  </button>
                ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
