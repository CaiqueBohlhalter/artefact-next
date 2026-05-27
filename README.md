# Task Manager

A small task management application built for a technical assessment using
Next.js 15, tRPC, TanStack Query, and Zod. It supports creating, listing,
editing, and deleting tasks while intentionally storing data in memory.

## Features

- Server-rendered initial task list.
- Incremental task loading through infinite scroll.
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

## Infinite Scroll Bonus

This branch extends the required solution with incremental loading on the task
list:

1. The server renders the first page of up to 10 tasks, preserving the SSR
   requirement.
2. `task.listPage` exposes additional pages using a numeric cursor over the
   in-memory, newest-first task order.
3. The client uses `useInfiniteQuery` and `IntersectionObserver` to fetch the
   next page when the loading marker approaches the viewport.
4. When a task is deleted, it is removed from visible cached pages immediately,
   and the loaded pages are revalidated to account for shifted offsets.

To test the bonus manually:

1. Create at least 12 tasks.
2. Open the list and confirm the newest 10 tasks are initially visible.
3. Scroll to the bottom and confirm the remaining tasks are appended.
4. Delete a visible task after loading multiple pages and confirm it disappears
   immediately without duplicating or hiding neighboring tasks.

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
| `task.listPage` | query | Return one page of tasks for infinite scroll. |
| `task.getById` | query | Return a task for the edit page. |
| `task.create` | mutation | Add a task. |
| `task.update` | mutation | Edit an existing task. |
| `task.delete` | mutation | Remove a task. |

The endpoint is handled at `/api/trpc/[trpc]`.

## Architecture Decisions

The first task page is loaded in `src/app/page.tsx`, a Server Component marked
as dynamic. It calls the tRPC router on the server and passes the result to the
interactive list. This provides server-rendered HTML for the first request
without making the server send an HTTP request to itself.

Client interactions use the same tRPC contract through
`@trpc/tanstack-react-query`. The task list uses an infinite query and a native
`IntersectionObserver` to load the next page as its marker approaches the
viewport. The in-memory store supplies an offset cursor, which is appropriate
for this small assessment dataset. After deletion, the deleted task is removed
from the visible cache immediately and loaded pages are revalidated so offsets
cannot remain stale. Create and edit navigations clear the paginated cache and
include a controlled feedback value, allowing the new SSR page to be shown
without introducing an additional state layer.

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
