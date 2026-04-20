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

    const { error } = await supabase
      .from("scans")
      .update({ [field]: value })
      .eq("id", selectedScan.id);

    if (!error) {
      setSelectedScan({ ...selectedScan, [field]: value });
      setScans((prev) =>
        prev.map((s) => (s.id === selectedScan.id ? { ...s, [field]: value } : s))
      );
      setSavedField(field);
      setTimeout(() => setSavedField(null), 2000);
    }

    setSavingField(null);
  }

  function handleScanChange(scanId: number) {
    const scan = scans.find((s) => s.id === scanId);
    if (scan) setSelectedScan(scan);
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
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, DNI o ID de paciente"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={searching || !searchTerm.trim()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {searching ? "Buscando..." : "Buscar"}
          </button>
        </form>
      </section>

      {/* Search results (multiple) */}
      {searchDone && !selectedPatient && patients.length > 1 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-gray-700">
            {patients.length} resultados
          </h2>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-600">
                <tr>
                  <th className="px-3 py-2 font-medium">ID</th>
                  <th className="px-3 py-2 font-medium">DNI</th>
                  <th className="px-3 py-2 font-medium">Nombre</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {patients.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => selectPatient(p)}
                    className="cursor-pointer hover:bg-blue-50 transition-colors"
                  >
                    <td className="px-3 py-2 text-gray-500">{p.id}</td>
                    <td className="px-3 py-2">{p.dni}</td>
                    <td className="px-3 py-2 font-medium">
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
        <p className="text-sm text-gray-500">No se encontraron pacientes.</p>
      )}

      {/* Selected patient */}
      {selectedPatient && (
        <section className="space-y-4">
          {/* Patient info */}
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {selectedPatient.last_name}, {selectedPatient.first_name}
              </h2>
              {patients.length > 1 && (
                <button
                  onClick={() => setSelectedPatient(null)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Volver a resultados
                </button>
              )}
            </div>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
              <span>ID: {selectedPatient.id}</span>
              <span>DNI: {selectedPatient.dni}</span>
            </div>
          </div>

          {/* Scans */}
          {loadingScans ? (
            <p className="text-sm text-gray-400">Cargando escaneos...</p>
          ) : scans.length === 0 ? (
            <p className="text-sm text-gray-500">
              Este paciente no tiene escaneos.
            </p>
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
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none sm:w-48"
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
                <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-4">
                  {/* Aligner counts */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-sm text-gray-500">
                        Alineadores superiores
                      </p>
                      <p className="text-xl font-semibold text-gray-900">
                        {selectedScan.upper_aligners_count !== null
                          ? selectedScan.upper_aligners_count
                          : "Pendiente de alineación"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">
                        Alineadores inferiores
                      </p>
                      <p className="text-xl font-semibold text-gray-900">
                        {selectedScan.lower_aligners_count !== null
                          ? selectedScan.lower_aligners_count
                          : "Pendiente de alineación"}
                      </p>
                    </div>
                  </div>

                  <hr className="border-gray-100" />

                  {/* Stage dropdowns */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <StageDropdown
                      label="Último alineador superior colocado"
                      field="upper_stage"
                      value={selectedScan.upper_stage}
                      max={selectedScan.upper_aligners_count}
                      saving={savingField === "upper_stage"}
                      saved={savedField === "upper_stage"}
                      onChange={(v) => updateStage("upper_stage", v)}
                    />
                    <StageDropdown
                      label="Último alineador inferior colocado"
                      field="lower_stage"
                      value={selectedScan.lower_stage}
                      max={selectedScan.lower_aligners_count}
                      saving={savingField === "lower_stage"}
                      saved={savedField === "lower_stage"}
                      onChange={(v) => updateStage("lower_stage", v)}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
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
      <label htmlFor={field} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      {disabled ? (
        <p className="mt-1 text-sm text-gray-400">Pendiente de alineación</p>
      ) : (
        <div className="mt-1 flex items-center gap-2">
          <select
            id={field}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            disabled={saving}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:opacity-50 sm:w-24"
          >
            {options.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          {saving && (
            <span className="text-xs text-gray-400">Guardando...</span>
          )}
          {saved && (
            <span className="text-xs text-green-600">Guardado</span>
          )}
        </div>
      )}
    </div>
  );
}
