# Schedule Editor — Adapter Layer

This directory contains the adapter boundary that separates **shift scheduling**
logic from the core **talk scheduling** editor.

## Modes

The editor operates in one of three modes, resolved from `data-mode` on the
host `#app` element:

| Mode | `data-mode` | Context |
|------|-------------|---------|
| `talks` | (absent or unset) | Organizer talk schedule editor |
| `shifts` | `shifts` | Organizer shift schedule editor (teamshifts plugin) |
| `public-shifts` | `public-shifts` | Public-facing volunteer shift grid |

## Required Host Attributes

The host template must set these `data-*` attributes on the `#app` mount element:

| Attribute | Required By | Description |
|-----------|-------------|-------------|
| `data-mode` | all shift modes | `"shifts"` or `"public-shifts"` |
| `data-csrf-token` | shifts, public-shifts | Django CSRF token for write requests |
| `data-claimed-shifts` | public-shifts | JSON array of shift IDs the current user has claimed |
| `data-claim-base-url` | public-shifts | Base URL for claim/withdraw form actions |

## Expected API Surface

### Organizer shifts mode (`data-mode="shifts"`)

Served by the teamshifts plugin (`ShiftSchedule*` views):

- `GET  /schedule/api/shifts/` — full schedule payload
- `POST /schedule/api/shifts/` — create shift
- `PATCH /schedule/api/shifts/:id/` — update shift
- `DELETE /schedule/api/shifts/:id/` — delete shift
- `GET  /schedule/api/members/` — accepted team members
- `POST /schedule/api/assignments/` — assign member to shift
- `DELETE /schedule/api/assignments/` — unassign member
- `GET  /schedule/api/availabilities/` — room/talk availabilities
- `GET  /schedule/api/warnings/` — scheduling warnings

### Public shifts mode (`data-mode="public-shifts"`)

- `GET /<org>/<event>/teamshifts/shifts/api/` — public schedule data
- `POST /<org>/<event>/teamshifts/shifts/:id/claim/` — claim a shift slot
- `POST /<org>/<event>/teamshifts/shifts/:id/withdraw/` — withdraw from shift

## Paired Plugin PR

This adapter is incomplete without the teamshifts plugin providing the backend
API views. The required plugin branch is:

- **Repository:** `fossasia/eventyay-teamshifts`
- **Branch:** `feat/shift-schedule`
- **PR:** fossasia/eventyay-teamshifts#77

Both PRs must ship together for the shift schedule feature to function.

## Architecture

```
src/adapters/
├── types.ts        — Mode, SessionKind, Capabilities, ApiConfig types
├── index.ts        — resolveMode(), getCapabilities(), getApiConfig(), resolveSessionKind()
└── README.md       — this file

src/api.ts          — HTTP layer, uses getApiConfig() for endpoint resolution
src/schemas.ts      — Zod schemas, additive `roles` + `kind` fields
src/App.vue         — uses getCapabilities() for all UI decisions
src/components/
└── Session.vue     — uses capabilities for card rendering, no mode branching
```

A future talk-schedule change should not need to understand teamshifts. The
adapter owns all shift-specific knowledge; components only ask "what is allowed?"
via the capabilities object.
