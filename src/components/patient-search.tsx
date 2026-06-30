"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Spinner } from "@/components/ui/spinner";
import type { Patient } from "@/lib/types";

interface PatientSearchProps {
  onSelectPatient: (patient: Patient) => void;
  onResults: (patients: Patient[]) => void;
  patients: Patient[];
  selectedPatient: Patient | null;
}

export default function PatientSearch({
  onSelectPatient,
  onResults,
  patients,
  selectedPatient,
}: PatientSearchProps) {
  const supabase = createClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchDone, setSearchDone] = useState(false);

  async function handleSearch() {
    const term = searchTerm.trim();
    if (!term) return;

    setSearching(true);
    setSearchDone(false);

    const isNumeric = /^\d+$/.test(term);

    let orFilters = `first_name.ilike.%${term}%,last_name.ilike.%${term}%`;
    if (isNumeric) {
      orFilters += `,dni.ilike.%${term}%`;

      // Prefix match on 5-digit patient ID via range query.
      // IDs are 10000-99999. Input "1" → [10000, 19999], "100" → [10000, 10099], "10023" → [10023, 10023].
      if (term.length <= 5) {
        const digits = term.length;
        const multiplier = Math.pow(10, 5 - digits);
        const lower = parseInt(term, 10) * multiplier;
        const upper = lower + multiplier - 1;
        orFilters += `,and(id.gte.${lower},id.lte.${upper})`;
      }
    }

    const { data } = await supabase
      .from("patients")
      .select("id, dni, first_name, last_name, lab_id, treatment_status, created_at")
      .or(orFilters)
      .order("last_name")
      .limit(50);

    const results = (data ?? []) as Patient[];
    onResults(results);
    setSearchDone(true);
    setSearching(false);

    if (results.length === 1) {
      onSelectPatient(results[0]);
    }
  }

  return (
    <>
      {/* Search bar */}
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
            className="flex-1 rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-text-primary placeholder-input-placeholder focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={searching || !searchTerm.trim()}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

      {/* Results table (multiple) */}
      {searchDone && !selectedPatient && patients.length > 1 && (
        <section>
          <h2 className="mb-2 text-sm font-medium text-text-muted">
            {patients.length} resultados
          </h2>
          <div className="overflow-x-auto rounded-xl border border-border bg-surface">
            <table className="w-full text-sm">
              <thead className="border-b border-border-subtle text-left text-xs uppercase tracking-wide text-text-muted">
                <tr>
                  <th className="px-4 py-2.5 font-medium">ID</th>
                  <th className="px-4 py-2.5 font-medium">DNI</th>
                  <th className="px-4 py-2.5 font-medium">Paciente</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {patients.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => onSelectPatient(p)}
                    className="cursor-pointer hover:bg-surface-hover active:bg-border-subtle transition-colors"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-text-muted tabular-nums">
                      {p.id}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-text-secondary">
                      {p.dni}
                    </td>
                    <td className="px-4 py-3 font-medium text-text-primary">
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
        <div className="rounded-xl border border-border bg-surface px-4 py-8 text-center">
          <p className="text-sm text-text-muted">No se encontraron pacientes.</p>
        </div>
      )}
    </>
  );
}
