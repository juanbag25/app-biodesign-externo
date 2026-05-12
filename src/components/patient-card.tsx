"use client";

import type { Patient } from "@/lib/types";

interface PatientCardProps {
  patient: Patient;
  showBack: boolean;
  onBack: () => void;
}

export default function PatientCard({
  patient,
  showBack,
  onBack,
}: PatientCardProps) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">
            {patient.last_name}, {patient.first_name}
          </h2>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-text-muted">
            <span className="tabular-nums">ID: {patient.id}</span>
            <span className="tabular-nums">DNI: {patient.dni}</span>
          </div>
        </div>
        {showBack && (
          <button
            onClick={onBack}
            className="shrink-0 rounded-lg px-3 py-1.5 text-sm text-text-link hover:bg-surface-hover active:bg-border-subtle transition-colors"
          >
            Volver
          </button>
        )}
      </div>
    </div>
  );
}
