# App Mezzi — Copilot Instructions

## Panoramica

App di gestione flotta aziendale (veicoli, scadenze, manutenzioni, rifornimenti, chilometraggi, documenti). UI interamente in italiano.

## Stack Tecnologico

- **Next.js 16** (App Router, standalone output, Turbopack)
- **React 19** — usare `useActionState` da `react`, **non** `useFormState` da `react-dom`
- **TypeScript 5** (strict mode)
- **Tailwind CSS 4** — configurazione via blocco `@theme` in CSS, non `tailwind.config.ts`
- **shadcn/ui v4** (stile `base-nova`) — usa `@base-ui/react`, **non** Radix. Niente `asChild`, usare render prop
- **Prisma 6** con PostgreSQL 16
- **Zod 4** — usare `.issues` per gli errori, **non** `.errors`
- **NextAuth v5 beta** (CredentialsProvider, JWT strategy)
- **Lucide React** per le icone

## Convenzioni di Codice

### Lingua

- Tutta l'interfaccia utente (label, messaggi, placeholder) **deve essere in italiano**
- Nomi variabili, funzioni e commenti in inglese
- Le label per gli enum Prisma sono in `src/lib/labels.ts`

### Struttura File

- Pagine: `src/app/(dashboard)/`
- Componenti UI: `src/components/ui/` (generati da shadcn)
- Componenti feature: `src/components/` (es. `vehicles/`, `users/`)
- Server Actions: `src/lib/actions/`
- Validatori Zod: `src/lib/validators.ts`
- Prisma client: `src/lib/prisma.ts`
- Auth config: `src/lib/auth.ts`
- Proxy (ex middleware): `src/proxy.ts`

### Pattern Importanti

- **@base-ui/react Button**: il componente Button imposta `type="button"` di default. Aggiungere **sempre** `type="submit"` esplicito nei bottoni dentro i form.
- **Server Actions con `useActionState`**: tutti i form usano server actions con `useActionState` da `react`. Lo state iniziale è `{ error: "", success: "" }`.
- **Async params in Next.js 16**: `params` e `searchParams` nelle pagine sono `Promise` — fare sempre `await`.
- **Scadenze auto vs manuali**: le scadenze auto-generate (tagliando, revisione, assicurazione, bollo) hanno priorità nell'UI. Le manuali sono secondarie. La logica di generazione è in `src/lib/auto-deadlines.ts`.
- **Tagliando con doppia scadenza**: il tagliando scade a 12 mesi OPPURE al km configurato (`maintenanceIntervalKm` su Vehicle), quello che arriva prima. Il campo `dueKm` su Deadline traccia la scadenza km.

### Validazione

- Validare input utente con Zod (schemi in `src/lib/validators.ts`)
- Nei server actions, usare `schema.safeParse()` e ritornare errori nel formato `{ error: string }`
- Controllare autenticazione con `auth()` da `src/lib/auth.ts` nelle server actions

## Comandi

```bash
npm run dev          # Dev server (porta da .env PORT, default 3005)
npm run build        # Build produzione
npm run lint         # ESLint 9 (flat config)
npx prisma migrate dev --name <nome>   # Nuova migrazione
npx prisma db seed   # Seed database
```

## Database

- PostgreSQL su `localhost:5432`, database `mezzi_db`
- Docker Compose mappa porta host `5433` → container `5432`
- Schema Prisma: `prisma/schema.prisma`
- Tutti gli ID usano `cuid()`

## Ruoli Utente

- **ADMIN**: accesso completo, gestione utenti
- **FLEET_MANAGER**: gestione flotta senza gestione utenti
- **DRIVER**: solo veicoli assegnati, lettura scadenze

## File Upload

- Directory: `uploads/` (configurabile via `UPLOAD_DIR` in `.env`)
- API routes: `src/app/api/documents/`
- Organizzati in sottocartelle per vehicle ID
