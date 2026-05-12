"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLabId } from "@/lib/lab-context";
import { Spinner } from "@/components/ui/spinner";
import type { Patient } from "@/lib/types";

interface PatientCreateFormProps {
  onCreated: (patient: Patient) => void;
  onCancel: () => void;
}

export default function PatientCreateForm({
  onCreated,
  onCancel,
}: PatientCreateFormProps) {
  const supabase = createClient();
  const labId = useLabId();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dni, setDni] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const trimmedDni = dni.trim();
    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();

    if (!trimmedFirst || !trimmedLast || !trimmedDni) {
      setError("Todos los campos son obligatorios.");
      setLoading(false);
      return;
    }

    // Check DNI duplicate (within own lab via RLS)
    const { data: existing } = await supabase
      .from("patients")
      .select("id")
      .eq("dni", trimmedDni)
      .limit(1);

    if (existing && existing.length > 0) {
      setError("Ya existe un paciente con ese DNI en tu consultorio.");
      setLoading(false);
      return;
    }

    // Insert patient
    const { data: newPatient, error: insertError } = await supabase
      .from("patients")
      .insert({
        first_name: trimmedFirst,
        last_name: trimmedLast,
        dni: trimmedDni,
        lab_id: labId,
      })
      .select("id, dni, first_name, last_name, lab_id, created_at")
      .single();

    if (insertError) {
      // Handle UNIQUE constraint from other labs
      if (
        insertError.code === "23505" ||
        insertError.message?.includes("duplicate") ||
        insertError.message?.includes("unique")
      ) {
        setError("Este paciente ya está registrado en el sistema.");
      } else {
        setError("Error al crear el paciente. Intentá de nuevo.");
      }
      setLoading(false);
      return;
    }

    setLoading(false);
    onCreated(newPatient as Patient);
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-4 sm:p-5">
      <h3 className="mb-3 text-sm font-semibold text-text-primary">
        Nuevo paciente
      </h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label
              htmlFor="new-first-name"
              className="block text-sm font-medium text-text-secondary"
            >
              Nombre
            </label>
            <input
              id="new-first-name"
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-border bg-input-bg px-3 py-2 text-sm text-text-primary placeholder-input-placeholder focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              placeholder="Juan"
            />
          </div>
          <div>
            <label
              htmlFor="new-last-name"
              className="block text-sm font-medium text-text-secondary"
            >
              Apellido
            </label>
            <input
              id="new-last-name"
              type="text"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-border bg-input-bg px-3 py-2 text-sm text-text-primary placeholder-input-placeholder focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              placeholder="Pérez"
            />
          </div>
          <div>
            <label
              htmlFor="new-dni"
              className="block text-sm font-medium text-text-secondary"
            >
              DNI
            </label>
            <input
              id="new-dni"
              type="text"
              required
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-border bg-input-bg px-3 py-2 text-sm text-text-primary placeholder-input-placeholder focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              placeholder="40555888"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-error-bg px-3 py-2 text-sm text-error-text">
            {error}
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading && <Spinner />}
            {loading ? "Creando..." : "Crear paciente"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm text-text-secondary hover:bg-surface-hover transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
