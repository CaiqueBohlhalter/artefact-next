"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import type { Task } from "@/server/tasks/task.model";
import { useTRPC } from "@/trpc/client";

type TaskFormProps = {
  task?: Task;
};

export function TaskForm({ task }: Readonly<TaskFormProps>) {
  const isEditingExistingTask = Boolean(task);
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [clientValidationError, setClientValidationError] = useState<
    string | null
  >(null);

  function handleSuccessfulSave() {
    queryClient.removeQueries(trpc.task.listPage.infiniteQueryFilter());
    router.push(
      `/?feedback=${isEditingExistingTask ? "updated" : "created"}`,
    );
    router.refresh();
  }

  const createTaskMutation = useMutation(
    trpc.task.create.mutationOptions({
      onSuccess: handleSuccessfulSave,
    }),
  );
  const updateTaskMutation = useMutation(
    trpc.task.update.mutationOptions({
      onSuccess: handleSuccessfulSave,
    }),
  );

  const saveTaskMutation = isEditingExistingTask
    ? updateTaskMutation
    : createTaskMutation;
  const titleValidationError =
    saveTaskMutation.error?.data?.validationErrors?.title?.[0] ?? null;
  const saveTaskErrorMessage = saveTaskMutation.error
    ? titleValidationError ?? saveTaskMutation.error.message
    : null;

  function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setClientValidationError(null);

    if (!title.trim()) {
      setClientValidationError("Title is required.");
      return;
    }

    const taskDetails = { title, description };

    if (task) {
      updateTaskMutation.mutate({ id: task.id, ...taskDetails });
      return;
    }

    createTaskMutation.mutate(taskDetails);
  }

  return (
    <form className="taskForm" onSubmit={handleFormSubmit} noValidate>
      {clientValidationError || saveTaskErrorMessage ? (
        <p className="feedback error" role="alert">
          {clientValidationError ?? saveTaskErrorMessage}
        </p>
      ) : null}
      <div className="field">
        <label htmlFor="title">Title</label>
        <input
          autoFocus
          disabled={saveTaskMutation.isPending}
          id="title"
          maxLength={120}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="What needs to be done?"
          required
          value={title}
        />
      </div>
      <div className="field">
        <label htmlFor="description">Description</label>
        <textarea
          disabled={saveTaskMutation.isPending}
          id="description"
          maxLength={1000}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Optional details"
          rows={5}
          value={description}
        />
      </div>
      <div className="actions formActions">
        <Link className="button secondary" href="/">
          Cancel
        </Link>
        <button
          className="button primary"
          disabled={saveTaskMutation.isPending}
          type="submit"
        >
          {saveTaskMutation.isPending
            ? "Saving..."
            : isEditingExistingTask
              ? "Save task"
              : "Create task"}
        </button>
      </div>
    </form>
  );
}
