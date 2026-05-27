# Task Manager

A small task management application built for a technical assessment using
Next.js 15, tRPC, TanStack Query, and Zod. It supports creating, listing,
editing, and deleting tasks while intentionally storing data in memory.

## Bonus Feature

The required solution is maintained in this branch. An additional infinite
scroll implementation is available in the
[`bonus/infinite-scroll`](../../tree/bonus/infinite-scroll) branch for review.

## Features

- Server-rendered initial task list.
- Typed CRUD API exposed through tRPC.
- Create and edit form with client-side and server-side validation.
- Success feedback for create, edit, and delete operations, plus mutation errors.
- Explicit not-found handling for deleted or invalid task edit URLs.
- Store and router tests covering the required backend behavior.

## Technology

- Next.js `15.5.18` with the App Router and TypeScript.
- React `19`.
- tRPC `11` for the typed backend contract.
- TanStack Query `5` for client-side queries, mutations, and invalidation.
- Zod `4` for runtime input validation.
- Vitest for backend tests.

## Running The Project

Requirements: Node.js 20.19 or later and npm.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Available validation commands:

```bash
npm run lint
npm test
npm run build
```

## Data Model

Each task contains:

```ts
type Task = Readonly<{
  id: string;
  title: string;
  description?: string;
  createdAt: string;
}>;
```

`id` is generated with `crypto.randomUUID()`. `createdAt` is an ISO timestamp
string so it can be sent through tRPC without a custom serializer.

## API Procedures

The application exposes these procedures under `task`:

| Procedure | Type | Purpose |
| --- | --- | --- |
| `task.list` | query | Return all tasks, newest first. |
| `task.getById` | query | Return a task for the edit page. |
| `task.create` | mutation | Add a task. |
| `task.update` | mutation | Edit an existing task. |
| `task.delete` | mutation | Remove a task. |

The endpoint is handled at `/api/trpc/[trpc]`.

## Architecture Decisions

The initial list is loaded in `src/app/page.tsx`, a Server Component marked as
dynamic. It calls the tRPC router on the server and passes the result to the
interactive list. This provides server-rendered HTML for the first request
without making the server send an HTTP request to itself.

Client interactions use the same tRPC contract through
`@trpc/tanstack-react-query`. After a successful mutation, the task-list query
is invalidated so the rendered state is fetched again from the in-memory
backend. Create and edit navigations include a controlled feedback value so the
list can confirm completion without introducing an additional state layer.

The task store is separate from the router. The running application uses one
process-wide instance, while tests inject a new store into a router instance.
The store exposes read-only task snapshots instead of its stored object
references. This keeps updates controlled by the store and keeps tests isolated
without adding test-only reset behavior to the application store.

Both the form and the router reject blank titles. The router is authoritative:
Zod validates inputs and tRPC returns explicit `NOT_FOUND` errors for operations
on missing tasks. The client-side validation exists only to provide immediate
feedback. The edit page maps malformed identifiers and genuine missing tasks to
the not-found view while allowing unexpected server errors to remain visible.

## In-Memory Storage Limitation

Tasks are kept in server process memory because persistence is outside the
assessment scope. Data is lost whenever the process restarts. In a distributed
or serverless deployment, different application instances can also hold
different task lists. A production version would replace the store with a
database-backed repository while retaining the router contract.
