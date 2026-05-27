"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { TASK_LIST_PAGE_SIZE } from "@/server/tasks/task.constants";
import type { TaskPage } from "@/server/tasks/task.model";
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
  initialTaskPage,
  operationSuccessMessage,
}: Readonly<{
  initialTaskPage: TaskPage;
  operationSuccessMessage?: string;
}>) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null);
  const [userFeedback, setUserFeedback] = useState<UserFeedback | null>(
    operationSuccessMessage
      ? { kind: "success", message: operationSuccessMessage }
      : null,
  );
  const taskListQuery = useInfiniteQuery(
    trpc.task.listPage.infiniteQueryOptions(
      { limit: TASK_LIST_PAGE_SIZE },
      {
        initialData: {
          pages: [initialTaskPage],
          pageParams: [null],
        },
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? null,
      },
    ),
  );
  const {
    data: taskPageData,
    error: taskListError,
    fetchNextPage,
    hasNextPage,
    isError: isTaskListError,
    isFetchingNextPage,
    isFetchNextPageError,
  } = taskListQuery;
  const deleteTaskMutation = useMutation(
    trpc.task.delete.mutationOptions({
      onSuccess: async (deletedTask) => {
        setUserFeedback({
          kind: "success",
          message: `"${deletedTask.title}" was deleted.`,
        });
        queryClient.setQueryData(
          trpc.task.listPage.infiniteQueryKey({ limit: TASK_LIST_PAGE_SIZE }),
          (currentTaskPageData) => {
            if (!currentTaskPageData) {
              return currentTaskPageData;
            }

            return {
              ...currentTaskPageData,
              pages: currentTaskPageData.pages.map((taskPage) => ({
                ...taskPage,
                tasks: taskPage.tasks.filter(
                  (task) => task.id !== deletedTask.id,
                ),
              })),
            };
          },
        );
        await queryClient.invalidateQueries(
          trpc.task.listPage.infiniteQueryFilter(),
        );
      },
      onError: (error) => {
        setUserFeedback({ kind: "error", message: error.message });
      },
    }),
  );

  useEffect(() => {
    const loadMoreTrigger = loadMoreTriggerRef.current;

    if (
      !loadMoreTrigger ||
      !hasNextPage ||
      isFetchNextPageError
    ) {
      return;
    }

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { rootMargin: "240px" },
    );

    intersectionObserver.observe(loadMoreTrigger);
    return () => intersectionObserver.disconnect();
  }, [
    fetchNextPage,
    hasNextPage,
    isFetchNextPageError,
    isFetchingNextPage,
  ]);

  const displayedTasks =
    taskPageData?.pages.flatMap((page) => page.tasks) ?? [];

  return (
    <section aria-label="Task list">
      {userFeedback ? (
        <p className={`feedback ${userFeedback.kind}`} role="status">
          {userFeedback.message}
        </p>
      ) : null}
      {isTaskListError && !isFetchNextPageError ? (
        <p className="feedback error" role="alert">
          Unable to load tasks: {taskListError.message}
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
      {isFetchNextPageError ? (
        <div className="loadMoreStatus" role="alert">
          <p>Unable to load more tasks.</p>
          <button
            className="button secondary"
            onClick={() => void fetchNextPage()}
            type="button"
          >
            Try again
          </button>
        </div>
      ) : hasNextPage ? (
        <div className="loadMoreStatus" ref={loadMoreTriggerRef}>
          {isFetchingNextPage
            ? "Loading more tasks..."
            : "Scroll to load more tasks."}
        </div>
      ) : displayedTasks.length > 0 ? (
        <p className="endOfList">All tasks loaded.</p>
      ) : null}
    </section>
  );
}
