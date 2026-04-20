"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Patient, Scan } from "@/lib/types";

export default function HomePage() {
  const supabase = createClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchDone, setSearchDone] = useState(false);

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [scans, setScans] = useState<Scan[]>([]);
  const [selectedScan, setSelectedScan] = useState<Scan | null>(null);
  const [loadingScans, setLoadingScans] = useState(false);

  const [savingField, setSavingField] = useState<string | null>(null);
  const [savedField, setSavedField] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);

  async function handleSearch() {
    const term = searchTerm.trim();
    if (!term) return;

    setSearching(true);
    setSearchDone(false);
    setSelectedPatient(null);
    setScans([]);
    setSelectedScan(null);

    const isNumeric = /^\d+$/.test(term);
    const isFiveDigit = /^\d{5}$/.test(term);

    let orFilters = `first_name.ilike.%${term}%,last_name.ilike.%${term}%`;
    if (isNumeric) {
      orFilters += `,dni.ilike.%${term}%`;
    }
    if (isFiveDigit) {
      orFilters += `,id.eq.${term}`;
    }

    const { data } = await supabase
      .from("patients")
      .select("id, dni, first_name, last_name, lab_id, created_at")
      .or(orFilters)
      .order("last_name")
      .limit(50);

    const results = (data ?? []) as Patient[];
    setPatients(results);
    setSearchDone(true);
    setSearching(false);

    if (results.length === 1) {
      selectPatient(results[0]);
    }
  }

  async function selectPatient(patient: Patient) {
    setSelectedPatient(patient);
    setLoadingScans(true);
    setSelectedScan(null);
    setUpdateError(null);

    const { data } = await supabase
      .from("scans")
      .select(
        "id, patient_id, scan_number, case_number, lab_name, download_date, upper_aligners_count, lower_aligners_count, upper_stage, lower_stage, created_at"
      )
      .eq("patient_id", patient.id)
      .order("scan_number", { ascending: false });

    const scanList = (data ?? []) as Scan[];
    setScans(scanList);
    if (scanList.length > 0) {
      setSelectedScan(scanList[0]);
    }
    setLoadingScans(false);
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

  return (
    <div className="space-y-6">
      {/* Search */}
      <section>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="flex gap-2"
        >
          <label htmlFor="search-input" className="sr-only">
            Buscar paciente
          </label>
          <input
            id="search-input"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, DNI o ID de paciente"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={searching || !searchTerm.trim()}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {searching && <Spinner />}
            <span className="hidden sm:inline">
              {searching ? "Buscando..." : "Buscar"}
            </span>
            <span className="sm:hidden">
              {searching ? "..." : "Buscar"}
            </span>
          </button>
        </form>
      </section>

      {/* Search results (multiple) */}
      {searchDone && !selectedPatient && patients.length > 1 && (
        <section>
          <h2 className="mb-2 text-sm font-medium text-gray-600">
            {patients.length} resultados
          </h2>
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50/80 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-2.5 font-medium">ID</th>
                  <th className="px-4 py-2.5 font-medium">DNI</th>
                  <th className="px-4 py-2.5 font-medium">Paciente</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {patients.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => selectPatient(p)}
                    className="cursor-pointer hover:bg-blue-50/60 active:bg-blue-100/60 transition-colors"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-gray-400 tabular-nums">
                      {p.id}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums">
                      {p.dni}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {p.last_name}, {p.first_name}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* No results */}
      {searchDone && patients.length === 0 && (
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-8 text-center shadow-sm">
          <p className="text-sm text-gray-500">No se encontraron pacientes.</p>
        </div>
      )}

      {/* Selected patient */}
      {selectedPatient && (
        <section className="space-y-4">
          {/* Patient card */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {selectedPatient.last_name}, {selectedPatient.first_name}
                </h2>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-gray-500">
                  <span className="tabular-nums">ID: {selectedPatient.id}</span>
                  <span className="tabular-nums">DNI: {selectedPatient.dni}</span>
                </div>
              </div>
              {patients.length > 1 && (
                <button
                  onClick={() => setSelectedPatient(null)}
                  className="shrink-0 rounded-lg px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 active:bg-blue-100 transition-colors"
                >
                  Volver
                </button>
              )}
            </div>
          </div>

          {/* Scans */}
          {loadingScans ? (
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-8 justify-center shadow-sm">
              <Spinner className="text-blue-600" />
              <span className="text-sm text-gray-500">
                Cargando escaneos...
              </span>
            </div>
          ) : scans.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white px-4 py-8 text-center shadow-sm">
              <p className="text-sm text-gray-500">
                Este paciente no tiene escaneos.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Scan selector */}
              <div>
                <label
                  htmlFor="scan-select"
                  className="block text-sm font-medium text-gray-700"
                >
                  Escaneo
                </label>
                <select
                  id="scan-select"
                  value={selectedScan?.id ?? ""}
                  onChange={(e) => handleScanChange(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none sm:w-52"
                >
                  {scans.map((s) => (
                    <option key={s.id} value={s.id}>
                      Escaneo {s.scan_number}
                    </option>
                  ))}
                </select>
              </div>

              {/* Scan details */}
              {selectedScan && (
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                  {/* Aligner counts */}
                  <div className="grid grid-cols-2 divide-x divide-gray-100 border-b border-gray-100">
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
                    <div className="border-t border-gray-100 px-4 py-3 sm:px-5">
                      <p className="text-sm text-red-600">{updateError}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
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
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      {pending ? (
        <p className="mt-1 text-sm italic text-gray-400">
          Pendiente de alineación
        </p>
      ) : (
        <>
          <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900">
            {count}
          </p>
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Etapa {stage}/{count}</span>
              <span>{count > 0 ? Math.round((stage / count) * 100) : 0}%</span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
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
        className="block text-sm font-medium text-gray-700"
      >
        {label}
      </label>
      {disabled ? (
        <p className="mt-1.5 text-sm italic text-gray-400">
          Pendiente de alineación
        </p>
      ) : (
        <div className="mt-1.5 flex items-center gap-2">
          <select
            id={field}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            disabled={saving}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm tabular-nums text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:opacity-50 sm:w-28"
          >
            {options.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          {saving && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Spinner className="text-gray-400" />
              Guardando
            </span>
          )}
          {saved && (
            <span className="flex items-center gap-1 text-xs font-medium text-green-600">
              <CheckIcon />
              Guardado
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function Spinner({ className = "text-white" }: { className?: string }) {
  return (
    <svg
      className={`h-4 w-4 animate-spin ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      className="h-3.5 w-3.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={3}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}
