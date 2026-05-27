"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import type { Task } from "@/server/tasks/task.model";
import { useTRPC } from "@/trpc/client";

type UserFeedback = {
  kind: "success" | "error";
  message: string;
};

const taskCreationDateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

export function TaskList({
  initialTasks,
  operationSuccessMessage,
}: Readonly<{
  initialTasks: readonly Task[];
  operationSuccessMessage?: string;
}>) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [userFeedback, setUserFeedback] = useState<UserFeedback | null>(
    operationSuccessMessage
      ? { kind: "success", message: operationSuccessMessage }
      : null,
  );
  const taskListQuery = useQuery(
    trpc.task.list.queryOptions(undefined, {
      initialData: initialTasks,
    }),
  );
  const deleteTaskMutation = useMutation(
    trpc.task.delete.mutationOptions({
      onSuccess: async (deletedTask) => {
        setUserFeedback({
          kind: "success",
          message: `"${deletedTask.title}" was deleted.`,
        });
        await queryClient.invalidateQueries(trpc.task.list.queryFilter());
      },
      onError: (error) => {
        setUserFeedback({ kind: "error", message: error.message });
      },
    }),
  );

  const displayedTasks = taskListQuery.data ?? [];

  return (
    <section aria-label="Task list">
      {userFeedback ? (
        <p className={`feedback ${userFeedback.kind}`} role="status">
          {userFeedback.message}
        </p>
      ) : null}
      {taskListQuery.isError ? (
        <p className="feedback error" role="alert">
          Unable to load tasks: {taskListQuery.error.message}
        </p>
      ) : null}
      {displayedTasks.length === 0 ? (
        <div className="emptyState">
          <h2>No tasks yet</h2>
          <p>Create a task to start organizing your work.</p>
        </div>
      ) : (
        <ul className="taskList">
          {displayedTasks.map((task) => {
            const isDeletingCurrentTask =
              deleteTaskMutation.isPending &&
              deleteTaskMutation.variables?.id === task.id;

            return (
              <li className="taskCard" key={task.id}>
                <div className="taskContent">
                  <h2>{task.title}</h2>
                  {task.description ? <p>{task.description}</p> : null}
                  <time dateTime={task.createdAt}>
                    Created{" "}
                    {taskCreationDateFormatter.format(new Date(task.createdAt))}{" "}
                    UTC
                  </time>
                </div>
                <div className="actions">
                  <Link
                    className="button secondary"
                    href={`/tasks/${task.id}/edit`}
                  >
                    Edit
                  </Link>
                  <button
                    className="button danger"
                    disabled={deleteTaskMutation.isPending}
                    onClick={() => {
                      setUserFeedback(null);
                      deleteTaskMutation.mutate({ id: task.id });
                    }}
                    type="button"
                  >
                    {isDeletingCurrentTask ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
