# CLAUDE.md — app-biodesign-externo

## Identidad del Proyecto

Este repositorio contiene una aplicación web para los odontólogos que trabajan con el laboratorio de alineadores dentales Biodesign.

**Stack:** Next.js, TailwindCSS, Supabase, desplegado en Vercel.

**Funcionalidad:** Los odontólogos se loguean, buscan a sus pacientes, ven la cantidad de alineadores por tratamiento, y marcan la etapa del tratamiento (último alineador colocado al paciente). No ven información de producción interna (impresión ni recortado).

## Repositorio de Contratos (LEER PRIMERO)

Antes de implementar CUALQUIER operación con la base de datos o tomar decisiones de diseño, leer los archivos del repositorio de contratos ubicado en:

```
RUTA_AL_REPO_CONTRACTS/app-biodesign-contracts
```

Archivos obligatorios a consultar:
- `schema.sql` → Esquema completo de la BD. Tablas, tipos, restricciones, RLS policies.
- `api-contracts.md` → Qué campos este proyecto lee y actualiza. **No tocar campos asignados a otros proyectos.**
- `system-description.md` → Descripción completa del sistema para contexto general.
- `changelog.md` → Historial de cambios. Leer si el coordinador indica que hubo modificaciones.

## Conexión a Supabase

Este proyecto usa la **`anon` key** de Supabase + **Supabase Auth** (email/password). RLS está activo y filtra automáticamente: cada odontólogo solo ve sus propios pacientes.

La autenticación usa Supabase Auth nativo. Los usuarios (labs/odontólogos) se crean previamente en Supabase. Cada lab tiene un `name`, un `email` para login y una contraseña.

## Permisos de Datos (RLS)

El esquema tiene RLS policies que garantizan que un odontólogo solo accede a:
- Su propio registro en `labs`
- Los `patients` cuyo `lab_id` coincide con su lab
- Los `scans` de esos pacientes

Este proyecto **NO tiene acceso** a:
- `printed_aligners` (datos de impresión — solo para uso interno del laboratorio)
- `processed_csvs` (control interno del script)

## Lo que Este Proyecto Lee

- `patients`: id, dni, first_name, last_name, created_at (filtrado por lab)
- `scans`: todos los campos excepto `upper_cut_up_to` y `lower_cut_up_to` (que no se muestran al odontólogo)
- `labs`: su propio registro (name, email)

## Lo que Este Proyecto Escribe

**SOLO actualiza dos campos en `scans`:**
- `upper_stage` → Último alineador superior colocado al paciente
- `lower_stage` → Último alineador inferior colocado al paciente

**No crea ni modifica** pacientes, escaneos, labs ni ningún otro dato.

## Funcionalidades

1. **Login:** Email y contraseña con Supabase Auth. Simplificado al máximo.
2. **Búsqueda de pacientes:** Por nombre, DNI o ID de Supabase. Solo dentro de los pacientes del lab logueado. Si hay múltiples resultados, mostrar lista para seleccionar.
3. **Selección de escaneo:** Por defecto el último (mayor scan_number). Dropdown para cambiar.
4. **Vista de alineadores:** Mostrar cantidad total de alineadores superiores e inferiores del escaneo seleccionado.
5. **Etapa del tratamiento:** Dos dropdowns (superior e inferior) con números del 0 al total de alineadores. El odontólogo selecciona el último alineador colocado. Se sincroniza con Supabase al cambiar.

## Reglas de Diseño

- **No mostrar:** datos de impresión (`printed_aligners`), datos de recortado (`upper_cut_up_to`, `lower_cut_up_to`). Estos son exclusivos del laboratorio.
- **UI limpia y simple:** Los odontólogos no son usuarios técnicos. La interfaz debe ser clara e intuitiva.
- **Responsive:** Debe funcionar bien en desktop y mobile (los odontólogos pueden acceder desde el celular).

## Cambios al Esquema de BD

Si durante el desarrollo necesitás agregar un campo, una tabla o modificar algo del esquema:
1. **NO lo hagas directamente.**
2. Proponelo al coordinador humano describiendo qué necesitás y por qué.
3. El coordinador actualizará el repo de contratos y te avisará.
4. Solo entonces implementá el cambio.

## Otro Proyecto que Comparte la BD

Existe un proyecto hermano (`app-biodesign-seguimiento-interno`) que son aplicaciones Python para el laboratorio. Comparte la misma base de datos Supabase. Ese proyecto:
- Crea patients y scans (desde CSV automáticamente o manualmente)
- Actualiza `upper/lower_aligners_count` en scans (detección automática de STLs)
- Crea registros en `printed_aligners` (detección automática)
- Actualiza `upper/lower_cut_up_to` en scans (registro manual de recortado)
- Lee `upper_stage` y `lower_stage` (los campos que este proyecto escribe)

No interferir con los campos que ese proyecto maneja.
