# AGENTS.md


Quick reference for PalcoDesk development.

## Dev Commands

  

```bash

pnpm dev          # Start all apps (API + Web)

pnpm build       # Build all packages

pnpm lint        # Run Biome

```

  

## Per-App Commands

  

| App | Command | Port | Notes |

|-----|---------|------|-------|

| API | `cd apps/api && pnpm dev` | 1337 | Hono + Drizzle |

| Web | `cd apps/web && pnpm dev` | 5173 | Vite + React |

| Web preview | `cd apps/web && pnpm preview` | 4173 | Preview built |

| API build | `cd apps/api && pnpm build` | - | esbuild bundle |

| DB generate | `cd apps/api && pnpm db:generate` | - | Drizzle migration |

| DB migrate | `cd apps/api && pnpm db:migrate` | - | Run migrations |

| DB studio | `cd apps/api && pnpm db:studio` | - | Drizzle GUI |

| Fix migrations | `cd apps/api && pnpm fix-migrations` | - | Fix migration issues |

  

## Env Setup (Required)

  

```bash

cp apps/api/.env.sample apps/api/.env

cp apps/web/.env.sample apps/web/.env

```

  

**API Required:** `DATABASE_URL`, `JWT_ACCESS`  

**Web Required:** `VITE_API_URL` (must match API port 1337)

  

## Project Structure

  

```

palcodesk/

├── apps/

│   ├── api/src/              # Backend (Hono)

│   │   ├── auth.ts          # Entry + auth routes

│   │   ├── index.ts         # Main app

│   │   ├── activity/       # Activity endpoints

│   │   ├── analytics/      # Analytics

│   │   ├── config/         # Config endpoints

│   │   ├── database/       # DB schema + migrations

│   │   ├── events/         # Events endpoints

│   │   ├── github/         # GitHub integration

│   │   ├── label/          # Labels

│   │   ├── middleware/    # Custom middleware

│   │   ├── notification/  # Notifications

│   │   ├── project/       # Projects

│   │   ├── task/           # Tasks

│   │   ├── time-entry/     # Time tracking

│   │   ├── user/          # User management

│   │   ├── workspace/     # Workspaces

│   │   └── ...

│   ├── web/src/             # Frontend (React)

│   │   ├── components/    # UI components

│   │   ├── routes/        # TanStack Router routes

│   │   ├── hooks/         # Custom hooks

│   │   ├── store/         # Zustand stores

│   │   ├── lib/           # Utilities

│   │   └── types/         # TypeScript types

│   └── docs/              # Documentation app

├── packages/

│   ├── libs/              # Shared code

│   └── typescript-config/

└── charts/               # Kubernetes Helm charts

```

  

## Architecture

  

- **Monorepo:** pnpm + Turbo (pnpm@10.15.0 enforced)

- **API:** Hono + Drizzle ORM + PostgreSQL + Better Auth

- **Web:** React 19 + TanStack Router + Tailwind v4 + Zustand

- **Lint:** Biome only (tabs, double quotes)

  

## Missing Tools

  

- **No tests** - CONTRIBUTING.md references `pnpm run test` but no test framework

- **No CI workflows** - no GitHub Actions

- **No typecheck** - root has no typecheck script

  

## Style

  

- Biome: tabs indentation, double quotes

- Conventional commits: `feat:`, `fix:`, `docs:`, etc.

  

## Project Rules (from claude.md)

  

### Plan Mode

- Usar modo planificación para tareas no triviales (3+ pasos o decisiones arquitectónicas)

- Si algo sale mal, DETENERSE y re-planear inmediatamente - no seguir insistiendo

- Usar modo planificación para pasos de verificación, no solo construcción

- Escribir specs detallados desde el inicio para reducir ambigüedad

  

### Subagent Strategy

- Usar subagents libremente para mantener la ventana de contexto limpia

- Delegar investigación, exploración y análisis paralelo a subagents

- Para problemas complejos, lanzar más compute via subagents

- Una task por subagent para ejecución enfocada

  

### Self-Improvement Loop

- Después de cualquier corrección del usuario: actualizar `task/lessons.md` con el patrón

- Escribir reglas para prevenir el mismo error

- Iterar implacablemente hasta que la tasa de errores disminuya

- Revisar lessons al inicio de cada sesión

  

### Verification Before Done

- Nunca marcar completo sin demostrar que funciona

- Comparar comportamiento antes y después de cambios cuando sea relevante

- Preguntarse: "¿Un engineer senior aprobaría esto?"

- Ejecutar tests, revisar logs, demostrar correctness

  

### Demand Elegance (Balanced)

- Para cambios no triviales: pausar y preguntar "¿hay forma más elegante?"

- Si un fix se siente hacky: implementar la solución elegante

- Omitir esto para fixes simples y obvios - no sobre-engineerar

- Cuestionar el propio trabajo antes de presentar

  

### Autonomous Bug Fixing

- Cuando hay reporte de bug: solo arreglarlo. No pedir hand-holding

- Apuntar a logs, errores, tests fallando - luego resolver

- Cero context switching requerido del usuario

- Arreglar CI tests fallando sin que se lo digan

  

### Task Management

1. **Plan First**: Escribir plan en `task/todo.md` con items verificables

2. **Verify Plan**: Revisar antes de implementar

3. **Track Progress**: Marcar items completos mientras avanzas

4. **Explain Changes**: Resumen de alto nivel en cada paso

5. **Document Results**: Añadir sección de review a `tasks/todo.md`

6. **Capture Lessons**: Actualizar `tasks/lessons.md` después de correcciones

  

### Core Principles

- **Simplicity First**: Cada cambio lo más simple posible. Impacto mínimo código.

- **No Laziness**: Encontrar root causes. No temporary fixes. Estándares senior.