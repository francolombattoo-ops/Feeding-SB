# San Bernardo Feedlot

Aplicación web responsive para la gestión diaria de alimentación de un feedlot (corral de engorde bovino). Pensada para que el encargado la use desde el celular mientras recorre los corrales: pocos clics, tarjetas grandes, todo el cálculo nutricional resuelto automáticamente.

## Qué hace

- **Alimentos**: cargás los ingredientes disponibles (Materia Seca %, Energía Metabolizable, Proteína Bruta).
- **Dietas**: combinás alimentos por % de Materia Seca (debe sumar 100%) y la app calcula en vivo MS, EM, PB y la relación PB/EM.
- **Corrales**: cada corral tiene animales, peso, dieta asignada y un consumo objetivo (% del peso vivo en MS). La app calcula automáticamente cuántos kilos de **Materia Húmeda** hay que cargar en el mixer.
- **Lectura de comederos**: tres botones (Falta / Justo / Sobra) por corral y por día. Sobra reduce el consumo un 5% (con confirmación). Dos Falta consecutivas ofrecen aumentar un 5%. Justo no modifica nada.
- **Panel**: resumen del día — corrales, animales, MS total, MH total a entregar hoy, y cuántos corrales están en cada estado de lectura.

Toda la lógica nutricional interna trabaja en **Materia Seca**. La Materia Húmeda es exclusivamente la vista de salida para el operario (`Kg MH = Kg MS ÷ (%MS/100)`).

## Stack

Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS · Supabase (Postgres + API) · pensado para desplegar en Vercel.

## Estructura del proyecto

```
app/
  page.tsx              → Panel (dashboard)
  alimentos/page.tsx    → Módulo Alimentos
  dietas/page.tsx       → Módulo Dietas
  corrales/page.tsx     → Módulo Corrales
  layout.tsx            → Layout raíz + navegación
  globals.css           → Sistema de diseño (tokens de color, tipografía)

components/
  ui/                   → Card, Button, Modal, Field (design system base)
  alimentos/            → Formulario de alimentos
  dietas/               → Editor de dietas + tarjetas de indicadores
  corrales/             → Tarjeta de corral, lectura de comedero, tabla MH, confirmación de ajuste
  Nav.tsx               → Navegación (sidebar en desktop, bottom nav en mobile)

hooks/                  → useAlimentos, useDietas, useCorrales, useDashboard
lib/
  nutricion.ts          → Motor de cálculo MS/MH (lógica pura, sin dependencias de UI)
  services/             → Capa de acceso a datos (Supabase) por módulo
  supabase/              → Clientes de Supabase (browser y server)
  utils.ts              → Formato de números y fechas

types/database.ts       → Tipos TypeScript que reflejan el esquema de la base
supabase/schema.sql      → Esquema completo de base de datos, listo para ejecutar
```

## Puesta en marcha

### 1. Crear el proyecto en Supabase

1. Andá a [supabase.com](https://supabase.com) y creá un proyecto nuevo.
2. En el **SQL Editor**, pegá y ejecutá el contenido completo de `supabase/schema.sql`. Esto crea todas las tablas, relaciones, triggers e índices.
3. En **Authentication > Providers**, activá **Email** (o el método que prefieras). Las políticas de RLS del esquema están escritas para usuarios `authenticated`; si por ahora no vas a manejar login, podés cambiar temporalmente las políticas a `anon` mientras probás (no recomendado para producción).
4. En **Project Settings > API**, copiá la **Project URL** y la **anon public key**.

### 2. Configurar variables de entorno

```bash
cp .env.local.example .env.local
```

Completá `.env.local` con los valores de Supabase:

```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

### 3. Instalar dependencias y correr en desarrollo

```bash
npm install
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000).

> Nota: este proyecto se generó sin acceso a red para instalar paquetes, así que `npm install` no se ejecutó ni se verificó en este entorno. El `package.json` incluye las versiones de Next.js 14 / React 18 / Supabase SSR compatibles entre sí; si `npm install` marca algún conflicto de peer dependency, correlo con `npm install --legacy-peer-deps`.

### 4. Cargar datos iniciales

Con la app corriendo:

1. Entrá a **Alimentos** y cargá tus ingredientes (Maíz, Silaje, Expeller, Núcleo, etc.)
2. Entrá a **Dietas** y armá al menos una dieta (ej. "Terminación") combinando esos alimentos hasta sumar 100% de MS.
3. Entrá a **Corrales** y creá tu primer corral, asignándole la dieta.
4. Volvé al **Panel** para ver el resumen general.

### 5. Desplegar en Vercel

```bash
vercel
```

O conectá el repositorio desde [vercel.com/new](https://vercel.com/new). Configurá las mismas variables de entorno (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) en **Project Settings > Environment Variables**.

## Decisiones de arquitectura relevantes

- **MS como fuente de verdad**: el esquema y todos los cálculos (`lib/nutricion.ts`) trabajan en Materia Seca. La Materia Húmeda nunca se persiste como dato editable — se recalcula siempre a partir de MS + % MS del alimento, evitando inconsistencias.
- **Historial diario como snapshot**: cada vez que se guarda una lectura de comedero, se persiste también un snapshot en `historial_diario` con el detalle de MH de ese día. Esto deja la base preparada para gráficos de evolución y reportes sin tener que recalcular hacia atrás.
- **Baja lógica, no física**: alimentos, dietas y corrales se "eliminan" marcando `activo = false`, para no romper el historial de dietas ya usadas o corrales ya cerrados.
- **Separación de capas**: `lib/nutricion.ts` no importa nada de Supabase ni de React — es lógica pura, fácil de testear. `lib/services/*` es la única capa que habla con la base. Los `hooks/*` conectan servicios con componentes. Los componentes no llaman a Supabase directamente.

## Funcionalidades futuras (arquitectura ya preparada)

El esquema y la estructura de carpetas están pensados para incorporar sin refactors grandes:

- Ganancia diaria de peso, conversión alimenticia, consumo real vs. objetivo
- Costo por dieta y costo/kg ganado (agregar tabla `precios_alimentos`)
- Inventario y stock de silos, compras de alimentos
- Mortalidad, tratamientos sanitarios, pesadas individuales
- Gráficos de evolución (la tabla `historial_diario` ya guarda series temporales)
- Reportes PDF y exportación a Excel
- Múltiples establecimientos (agregar `establecimiento_id` a las tablas principales)
- Usuarios con permisos (Administrador / Nutricionista / Encargado) vía Supabase Auth + RLS por rol
- Modo offline con sincronización (Supabase soporta esto vía `@supabase/ssr` + estrategias de cache)
