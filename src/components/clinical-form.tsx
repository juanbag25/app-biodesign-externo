"use client";

import { useState, type FormEvent } from "react";
import ImageUploadField from "@/components/image-upload-field";
import ScannerSelect from "@/components/scanner-select";
import { Spinner } from "@/components/ui/spinner";
import { PHOTO_KEYS, type ClinicalForm as ClinicalFormType, type PhotoKey, type ScannerType } from "@/lib/types";

const PHOTO_SECTIONS = [
  {
    title: "Cara",
    description: "Paciente sin sonreír",
    fields: [
      { key: "face_front", label: "Frente" },
      { key: "face_left", label: "Perfil izquierdo" },
      { key: "face_right", label: "Perfil derecho" },
    ],
  },
  {
    title: "Sonrisa",
    description: null,
    fields: [
      { key: "smile_front", label: "Frente" },
      { key: "smile_left", label: "Perfil izquierdo" },
      { key: "smile_right", label: "Perfil derecho" },
    ],
  },
  {
    title: "Radiografía",
    description: null,
    fields: [
      { key: "xray_front", label: "Frente" },
      { key: "xray_left", label: "Perfil izquierdo" },
      { key: "xray_right", label: "Perfil derecho" },
    ],
  },
] as const;

const REASONS = [
  { key: "reason_aesthetics", label: "Estética" },
  { key: "reason_bite", label: "Mordida" },
  { key: "reason_crowding", label: "Apiñamiento" },
  { key: "reason_spacing", label: "Separación dental" },
  { key: "reason_ortho_relapse", label: "Recaída ortodoncia previa" },
] as const;

const DIAGNOSIS_CLASS = [
  { key: "diagnosis_class_1", label: "Clase 1" },
  { key: "diagnosis_class_2", label: "Clase 2" },
  { key: "diagnosis_class_3", label: "Clase 3" },
] as const;

const DIAGNOSIS_CROWDING = [
  { key: "diagnosis_crowding_mild", label: "Leve" },
  { key: "diagnosis_crowding_moderate", label: "Moderado" },
  { key: "diagnosis_crowding_severe", label: "Severo" },
] as const;

const DIAGNOSIS_OTHER = [
  { key: "diagnosis_diastemas", label: "Diastemas" },
  { key: "diagnosis_open_bite", label: "Mordida abierta" },
  { key: "diagnosis_crossbite", label: "Mordida cruzada" },
  { key: "diagnosis_deep_bite", label: "Sobremordida aumentada" },
] as const;

type BoolKey = (typeof REASONS)[number]["key"]
  | (typeof DIAGNOSIS_CLASS)[number]["key"]
  | (typeof DIAGNOSIS_CROWDING)[number]["key"]
  | (typeof DIAGNOSIS_OTHER)[number]["key"];

export type PhotoFiles = Record<PhotoKey, File | null>;
export type PhotoUrls = Record<PhotoKey, string | null>;

export interface ClinicalFormData {
  photos: PhotoFiles;
  notes: string;
  checkboxes: Record<BoolKey, boolean>;
  scanner: ScannerType | null;
}

interface ClinicalFormProps {
  readOnly: boolean;
  existingData?: ClinicalFormType | null;
  existingImageUrls?: PhotoUrls;
  loading: boolean;
  error: string;
  /** Show the (required) scanner selector — only when creating a new scan. */
  showScanner?: boolean;
  /** Pre-selected scanner from the lab's most recent scan (null = no history). */
  defaultScanner?: ScannerType | null;
  onSubmit: (data: ClinicalFormData) => void;
  onCancel: () => void;
}

function emptyPhotos(): PhotoFiles {
  const obj: Record<string, File | null> = {};
  PHOTO_KEYS.forEach((k) => {
    obj[k] = null;
  });
  return obj as PhotoFiles;
}

function emptyUrls(): PhotoUrls {
  const obj: Record<string, string | null> = {};
  PHOTO_KEYS.forEach((k) => {
    obj[k] = null;
  });
  return obj as PhotoUrls;
}

function defaultCheckboxes(): Record<BoolKey, boolean> {
  const obj: Record<string, boolean> = {};
  [...REASONS, ...DIAGNOSIS_CLASS, ...DIAGNOSIS_CROWDING, ...DIAGNOSIS_OTHER].forEach(
    (item) => {
      obj[item.key] = false;
    }
  );
  return obj as Record<BoolKey, boolean>;
}

function checkboxesFromData(data: ClinicalFormType): Record<BoolKey, boolean> {
  const obj: Record<string, boolean> = {};
  [...REASONS, ...DIAGNOSIS_CLASS, ...DIAGNOSIS_CROWDING, ...DIAGNOSIS_OTHER].forEach(
    (item) => {
      obj[item.key] = !!(data as unknown as Record<string, unknown>)[item.key];
    }
  );
  return obj as Record<BoolKey, boolean>;
}

export default function ClinicalForm({
  readOnly,
  existingData,
  existingImageUrls,
  loading,
  error,
  showScanner = false,
  defaultScanner = null,
  onSubmit,
  onCancel,
}: ClinicalFormProps) {
  const [photos, setPhotos] = useState<PhotoFiles>(emptyPhotos);
  const [notes, setNotes] = useState(existingData?.notes ?? "");
  const [checkboxes, setCheckboxes] = useState<Record<BoolKey, boolean>>(
    existingData ? checkboxesFromData(existingData) : defaultCheckboxes()
  );
  const [scanner, setScanner] = useState<ScannerType | "">(defaultScanner ?? "");
  const [validationError, setValidationError] = useState("");

  const urls: PhotoUrls = existingImageUrls ?? emptyUrls();

  function setPhoto(key: PhotoKey, file: File | null) {
    setPhotos((prev) => ({ ...prev, [key]: file }));
  }

  function toggleCheckbox(key: BoolKey) {
    if (readOnly) return;
    setCheckboxes((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setValidationError("");

    if (showScanner && !scanner) {
      setValidationError("Elegí con qué escáner se hizo el escaneo.");
      return;
    }

    const hasImage = Object.values(photos).some(Boolean);
    const hasNotes = notes.trim().length > 0;
    const hasCheckbox = Object.values(checkboxes).some(Boolean);

    if (!hasImage && !hasNotes && !hasCheckbox) {
      setValidationError(
        "El formulario no puede estar completamente vacío. Completá al menos un campo."
      );
      return;
    }

    onSubmit({ photos, notes, checkboxes, scanner: scanner || null });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Scanner selector (only when creating a new scan) */}
      {showScanner && <ScannerSelect value={scanner} onChange={setScanner} />}

      {/* Photo sections */}
      {PHOTO_SECTIONS.map((section) => (
        <div key={section.title}>
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-text-primary">
              {section.title}
            </h3>
            {section.description && (
              <p className="text-xs text-text-muted">{section.description}</p>
            )}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {section.fields.map((field) => (
              <ImageUploadField
                key={field.key}
                label={field.label}
                existingUrl={urls[field.key as PhotoKey]}
                readOnly={readOnly}
                onChange={(file) => setPhoto(field.key as PhotoKey, file)}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Notes */}
      <div>
        <label
          htmlFor="clinical-notes"
          className="block text-sm font-semibold text-text-primary"
        >
          Notas
        </label>
        <textarea
          id="clinical-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={readOnly}
          rows={3}
          className="mt-1.5 block w-full rounded-lg border border-border bg-input-bg px-3 py-2 text-sm text-text-primary placeholder-input-placeholder focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:opacity-60"
          placeholder={readOnly ? "" : "Observaciones clínicas..."}
        />
      </div>

      {/* Reason checkboxes */}
      <CheckboxGroup
        title="Motivo de consulta"
        items={REASONS}
        values={checkboxes}
        readOnly={readOnly}
        onToggle={toggleCheckbox}
      />

      {/* Diagnosis: class */}
      <CheckboxGroup
        title="Diagnóstico — Clase"
        items={DIAGNOSIS_CLASS}
        values={checkboxes}
        readOnly={readOnly}
        onToggle={toggleCheckbox}
      />

      {/* Diagnosis: crowding */}
      <CheckboxGroup
        title="Diagnóstico — Apiñamiento"
        items={DIAGNOSIS_CROWDING}
        values={checkboxes}
        readOnly={readOnly}
        onToggle={toggleCheckbox}
      />

      {/* Diagnosis: other */}
      <CheckboxGroup
        title="Diagnóstico — Otros hallazgos"
        items={DIAGNOSIS_OTHER}
        values={checkboxes}
        readOnly={readOnly}
        onToggle={toggleCheckbox}
      />

      {/* Errors */}
      {(validationError || error) && (
        <div className="rounded-lg bg-error-bg px-3 py-2 text-sm text-error-text">
          {validationError || error}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        {!readOnly && (
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading && <Spinner />}
            {loading ? "Guardando..." : "Guardar formulario"}
          </button>
        )}
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-border px-5 py-2.5 text-sm text-text-secondary hover:bg-surface-hover transition-colors"
        >
          Volver
        </button>
      </div>
    </form>
  );
}

function CheckboxGroup({
  title,
  items,
  values,
  readOnly,
  onToggle,
}: {
  title: string;
  items: ReadonlyArray<{ key: BoolKey; label: string }>;
  values: Record<BoolKey, boolean>;
  readOnly: boolean;
  onToggle: (key: BoolKey) => void;
}) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-text-primary">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => {
          const checked = values[item.key];
          return (
            <button
              key={item.key}
              type="button"
              disabled={readOnly}
              onClick={() => onToggle(item.key)}
              className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                checked
                  ? "border-blue-500 bg-blue-600/20 text-blue-400 font-medium"
                  : "border-border bg-surface text-text-secondary hover:bg-surface-hover"
              } ${readOnly ? "cursor-default opacity-80" : "cursor-pointer"}`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
