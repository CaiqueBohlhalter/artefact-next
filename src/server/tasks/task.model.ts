export type Task = Readonly<{
  id: string;
  title: string;
  description?: string;
  createdAt: string;
}>;

export type TaskDetails = Pick<Task, "title" | "description">;

export type TaskPage = Readonly<{
  tasks: readonly Task[];
  nextCursor?: number;
}>;
