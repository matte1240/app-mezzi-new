# App Mezzi

Applicazione di gestione flotta aziendale basata su Next.js, Prisma e PostgreSQL.

## Prerequisiti

- Node.js 20+
- npm 10+
- PostgreSQL 16 (oppure Docker Compose)
- Redis 7 (opzionale ma consigliato)

## Variabili ambiente

Parti da [.env.example](.env.example) e imposta almeno:

- `DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `SMTP_*` per email scadenze
- `UPLOAD_DIR`
- `REDIS_URL` per cache dashboard e idempotenza cron

Esempio locale Redis:

```bash
REDIS_URL="redis://localhost:6379"
```

## Avvio rapido (locale)

```bash
npm install
npm run dev
```

App disponibile su `http://localhost:3005` (o porta `PORT` configurata).

## Avvio con Docker Compose

Lo stack include:

- `db` (PostgreSQL)
- `redis` (Redis)
- `app` (Next.js)

```bash
docker compose up --build
```

## Comandi utili

```bash
npm run dev
npm run lint
npm run build
npx prisma migrate deploy
```

## Redis: comportamento attuale

L'integrazione Redis e fail-open (resiliente):

- Se Redis e disponibile:
	- cache read-through della dashboard (TTL breve)
	- dedup/idempotenza invii email nel cron scadenze
- Se Redis non e disponibile:
	- l'app continua a funzionare
	- dashboard usa query DB dirette
	- cron continua a inviare email senza dedup

## Cron scadenze

Endpoint:

- `GET /api/cron/deadlines`

Protezione con header:

- `Authorization: Bearer <CRON_SECRET>` (se `CRON_SECRET` impostato)
