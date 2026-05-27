import Link from "next/link";
import { TaskForm } from "@/components/tasks/task-form";

export default function NewTaskPage() {
  return (
    <main className="container narrow">
      <Link className="backLink" href="/">
        Back to tasks
      </Link>
      <header className="formHeader">
        <p className="eyebrow">Task management</p>
        <h1>New task</h1>
      </header>
      <TaskForm />
    </main>
  );
}
