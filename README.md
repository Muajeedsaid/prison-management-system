# Prison Management Information System (PMIS)

Final-year project: *Design and Implementation of an Enhanced Prison Management Information System for Inmate Records and Correctional Facility Administration.*

A modular-monolith web system:

| Part | Tech | Folder |
|---|---|---|
| REST API | NestJS 10, MongoDB (Mongoose 8), JWT, Swagger | `backend/` |
| Web app | Next.js 14 (App Router, TypeScript) | `frontend/` |
| Database | MongoDB 7 | `docker-compose.yml` |

## 1. Run it

### Option A: Docker (easiest)
```bash
cp .env.example .env        # then edit the two JWT secrets
docker compose up --build
docker compose exec backend node dist/seed/seed.js   # load demo data (once)
```
Open http://localhost:3000 (app) and http://localhost:4000/api/docs (Swagger).

### Option B: Without Docker
Needs Node 20+ and a running MongoDB.
```bash
# Terminal 1 - API
cd backend
cp .env.example .env         # set MONGODB_URI and the JWT secrets
npm install
npm run seed                 # demo users, cells, inmates
npm run start:dev            # http://localhost:4000/api/v1

# Terminal 2 - Web
cd frontend
cp .env.example .env.local
npm install
npm run dev                  # http://localhost:3000
```

## 2. Demo accounts (created by `npm run seed`)
Password for all: the value of `SEED_PASSWORD` in `backend/.env` (default in `.env.example`).

| Role | Email |
|---|---|
| Facility Controller (admin of operations) | controller@pms.local |
| System Admin | admin@pms.local |
| Records Officer | records@pms.local |
| Cell Officer | cell@pms.local |
| Medical Officer | medical@pms.local |
| Court Liaison | court@pms.local |
| Visitor Desk | visitor@pms.local |

**Change the password and secrets before any real use.** All inmates in the seed are fictional.

## 3. Who can do what

| Action | admin | controller | records | cell | medical | court | visitor_desk |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Manage users, read audit log | ✔ | | | | | | |
| Read inmates | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| Register / edit inmate | | | ✔ | | | | |
| Archive inmate (soft delete) | | ✔ | | | | | |
| Create / edit cells, view cells | | ✔ | | view only | | | |
| Transfer inmate between cells | | | | ✔ | | | |
| Open case | | | ✔ | | | ✔ | |
| Read cases | | ✔ | ✔ | | | ✔ | |
| Update case (court dates, bail, judgment) | | | | | | ✔ | |
| Medical records | | ✔ (read) | | | ✔ | | |
| Visits (schedule / update) | | read | | | | | ✔ |
| Incidents (file) | | read | | ✔ | | | |
| Release | | ✔ | | | | | |
| Reports / dashboard | | ✔ | | | | | |

The exact rules live in `backend/src/**/**.controller.ts` (`@Roles(...)`) and are mirrored for UI hiding in `frontend/lib/permissions.ts`. The backend is the real enforcement; the frontend only hides buttons.

## 4. Learning REST with this project

Base URL: `http://localhost:4000/api/v1`. Every route is documented and testable at `/api/docs`.

| Idea | Example in this project |
|---|---|
| Resources are nouns | `/inmates`, `/cells`, `/cases` |
| HTTP verbs are actions | `GET` read, `POST` create, `PATCH` partial update, `DELETE` remove |
| Nesting shows ownership | `GET /inmates/:id/cases`, `POST /inmates/:id/visits` |
| Status codes carry meaning | 201 created, 204 no content, 400 validation, 401 not logged in, 403 wrong role, 404 missing, 409 conflict (cell full), 422 business rule broken |
| Stateless auth | `Authorization: Bearer <accessToken>` on each call |
| Pagination | `GET /inmates?page=2&limit=10&search=ali&sort=-createdAt` returns `{ data, meta }` |
| Uniform errors | `{ "statusCode": 409, "error": "Conflict", "message": "..." }` |

Try it with curl:
```bash
TOKEN=$(curl -s localhost:4000/api/v1/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"records@pms.local","password":"<SEED_PASSWORD>"}' | jq -r .accessToken)
curl -s localhost:4000/api/v1/inmates -H "Authorization: Bearer $TOKEN" | jq
```

## 5. Architecture in short

```
Browser (Next.js)  --HTTPS/JSON-->  NestJS API  -->  MongoDB
                                     |
        Request pipeline:  Helmet/CORS -> Throttler -> JwtAuthGuard -> RolesGuard
                           -> ValidationPipe -> Controller -> Service -> Mongoose
                           -> AuditInterceptor (all non-GET) -> AllExceptionsFilter
```
Modules: `auth`, `users`, `inmates`, `cells`, `cases`, `visits`, `medical`, `incidents`, `releases`, `reports`, `audit`, plus `common` (guards, decorators, pagination).
Controllers only handle HTTP; services hold business rules; schemas define data.

Key rules enforced in services: release date cannot precede admission; released inmates cannot be edited; full cells reject transfers (409); a case cannot be closed without a judgment (422); cell capacity cannot drop below its occupancy; inmate numbers (`INM-2026-0001`) come from an atomic counter; deletes are soft (`isArchived`).

## 6. Notes and deviations from the architecture document
- Read access to inmates is wider than first drafted (all staff roles) so each officer can see the person they act on; writes remain role-specific.
- Extra endpoints were added for the UI: `/reports/summary`, `/cases/upcoming`, `/releases`, `/incidents`.
- Access/refresh tokens are kept in `localStorage` for simplicity and learning. For production, move the refresh token to an `httpOnly` secure cookie.
- Tested: backend compiles, 4 unit tests pass (role guard), frontend type-checks and builds. The API was not exercised against a live MongoDB in the authoring environment, so run the seed and click through once and report any bug.

## 7. Ideas to extend
E2E tests with `mongodb-memory-server`, file upload for inmate photos, PDF reports, email/SMS court-date reminders, refresh-token cookies, CI pipeline.
