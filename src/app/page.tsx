import Link from "next/link";
import { TaskList } from "@/components/tasks/task-list";
import { TASK_LIST_PAGE_SIZE } from "@/server/tasks/task.constants";
import { createServerCaller } from "@/server/trpc/app-router";

export const dynamic = "force-dynamic";

const taskOperationSuccessMessages = {
  created: "Task created successfully.",
  updated: "Task updated successfully.",
} as const;

export default async function TaskListPage({
  searchParams,
}: Readonly<{ searchParams: Promise<{ feedback?: string | string[] }> }>) {
  const { feedback } = await searchParams;
  const initialTaskPage = await createServerCaller().task.listPage({
    limit: TASK_LIST_PAGE_SIZE,
  });
  const taskOperationFeedbackKey =
    typeof feedback === "string" ? feedback : undefined;
  const operationSuccessMessage =
    taskOperationFeedbackKey &&
    taskOperationFeedbackKey in taskOperationSuccessMessages
      ? taskOperationSuccessMessages[
          taskOperationFeedbackKey as keyof typeof taskOperationSuccessMessages
        ]
      : undefined;

  return (
    <main className="container">
      <header className="pageHeader">
        <div>
          <p className="eyebrow">Task management</p>
          <h1>Tasks</h1>
          <p className="subtitle">
            Track work with a simple in-memory task list.
          </p>
        </div>
        <Link href="/tasks/new" className="button primary">
          New task
        </Link>
      </header>
      <TaskList
        initialTaskPage={initialTaskPage}
        operationSuccessMessage={operationSuccessMessage}
      />
    </main>
  );
}
