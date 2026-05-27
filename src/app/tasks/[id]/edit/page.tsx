import { TRPCError } from "@trpc/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { TaskForm } from "@/components/tasks/task-form";
import { createServerCaller } from "@/server/trpc/app-router";

export const dynamic = "force-dynamic";

export default async function EditTaskPage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;

  if (!z.string().uuid().safeParse(id).success) {
    notFound();
  }

  try {
    const task = await createServerCaller().task.getById({ id });

    return (
      <main className="container narrow">
        <Link className="backLink" href="/">
          Back to tasks
        </Link>
        <header className="formHeader">
          <p className="eyebrow">Task management</p>
          <h1>Edit task</h1>
        </header>
        <TaskForm task={task} />
      </main>
    );
  } catch (error) {
    if (error instanceof TRPCError && error.code === "NOT_FOUND") {
      notFound();
    }

    throw error;
  }
}
