"use client";

import type { ScannerType } from "@/lib/types";

interface ScannerSelectProps {
  value: ScannerType | "";
  onChange: (value: ScannerType | "") => void;
  id?: string;
  label?: string;
}

/** Required scanner selector (Shining 3D / Medit Link). Shared by the clinical
 * form (treatment scans) and the retention Modo A flow. */
export default function ScannerSelect({
  value,
  onChange,
  id = "scanner-select",
  label = "¿Con qué escáner escaneaste al paciente?",
}: ScannerSelectProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-semibold text-text-primary"
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as ScannerType | "")}
        className="mt-1.5 block w-full rounded-lg border border-border bg-input-bg px-3 py-2.5 text-sm text-text-primary focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none sm:w-64"
      >
        <option value="">Seleccioná el escáner…</option>
        <option value="shining">Shining 3D</option>
        <option value="medit">Medit Link</option>
      </select>
    </div>
  );
}
