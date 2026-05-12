"use client";

import { useState } from "react";
import PatientSearch from "@/components/patient-search";
import PatientCard from "@/components/patient-card";
import PatientCreateForm from "@/components/patient-create-form";
import ScanSection from "@/components/scan-section";
import type { Patient } from "@/lib/types";

export default function HomePage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  function handleResults(results: Patient[]) {
    setPatients(results);
    setSelectedPatient(null);
    setShowCreateForm(false);
  }

  function handleSelectPatient(patient: Patient) {
    setSelectedPatient(patient);
    setShowCreateForm(false);
  }

  function handlePatientCreated(patient: Patient) {
    setPatients([patient]);
    setSelectedPatient(patient);
    setShowCreateForm(false);
  }

  return (
    <div className="space-y-6">
      <PatientSearch
        onSelectPatient={handleSelectPatient}
        onResults={handleResults}
        patients={patients}
        selectedPatient={selectedPatient}
      />

      {/* Nuevo paciente button / form */}
      {!selectedPatient && (
        <>
          {!showCreateForm ? (
            <div className="flex justify-center">
              <button
                onClick={() => setShowCreateForm(true)}
                className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
              >
                + Nuevo paciente
              </button>
            </div>
          ) : (
            <PatientCreateForm
              onCreated={handlePatientCreated}
              onCancel={() => setShowCreateForm(false)}
            />
          )}
        </>
      )}

      {/* Selected patient */}
      {selectedPatient && (
        <section className="space-y-4">
          <PatientCard
            patient={selectedPatient}
            showBack={patients.length > 1}
            onBack={() => setSelectedPatient(null)}
          />
          <ScanSection patient={selectedPatient} />
        </section>
      )}
    </div>
  );
}
