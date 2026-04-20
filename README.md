# Biodesign - Portal de Odontologos

App web para odontologos que trabajan con el laboratorio de alineadores dentales Biodesign. Permite buscar pacientes, ver la cantidad de alineadores por tratamiento y marcar la etapa del tratamiento (ultimo alineador colocado).

## Stack

- **Next.js** (App Router, TypeScript)
- **TailwindCSS**
- **Supabase** (Auth + PostgreSQL con RLS)
- **Vercel** (deploy)

## Requisitos previos

- Node.js 18+
- Un proyecto en Supabase con el esquema de BD aplicado (ver repo de contratos)
- Usuarios creados en Supabase Auth con sus labs correspondientes en la tabla `labs`

## Instalacion

```bash
npm install
```

## Variables de entorno

Copia `.env.example` a `.env.local` y completa los valores:

```bash
cp .env.example .env.local
```

| Variable | Descripcion |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave `anon` (publica) de Supabase |

**Importante:** esta app usa la clave `anon`, NO la `service_role`. El RLS filtra los datos automaticamente por lab.

## Desarrollo

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

## Build

```bash
npm run build
```

## Deploy en Vercel

1. Conectar el repositorio en [vercel.com](https://vercel.com).
2. Configurar las variables de entorno (`NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`) en Settings > Environment Variables.
3. Deploy automatico en cada push a `main`.
