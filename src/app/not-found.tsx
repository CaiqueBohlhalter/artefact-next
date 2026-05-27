import Link from "next/link";

export default function NotFound() {
  return (
    <main className="container narrow">
      <div className="emptyState">
        <h1>Task not found</h1>
        <p>The requested task no longer exists.</p>
        <Link href="/" className="button primary">
          Return to tasks
        </Link>
      </div>
    </main>
  );
}
