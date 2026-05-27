import type { Task, TaskDetails } from "./task.model";

export class TaskStore {
  private readonly tasks: Task[];

  constructor(initialTasks: readonly Task[] = []) {
    this.tasks = initialTasks.map((task) => this.createSnapshot(task));
  }

  list(): readonly Task[] {
    return this.tasks.map((task) => this.createSnapshot(task));
  }

  findById(taskId: string): Task | undefined {
    const storedTask = this.tasks.find((task) => task.id === taskId);

    return storedTask ? this.createSnapshot(storedTask) : undefined;
  }

  create(taskDetails: TaskDetails): Task {
    const newTask: Task = {
      ...taskDetails,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };

    this.tasks.unshift(newTask);
    return this.createSnapshot(newTask);
  }

  update(taskId: string, taskDetails: TaskDetails): Task | undefined {
    const taskIndex = this.tasks.findIndex((task) => task.id === taskId);

    if (taskIndex === -1) {
      return undefined;
    }

    const updatedTask: Task = {
      ...this.tasks[taskIndex],
      ...taskDetails,
    };

    this.tasks[taskIndex] = updatedTask;
    return this.createSnapshot(updatedTask);
  }

  delete(taskId: string): Task | undefined {
    const taskIndex = this.tasks.findIndex((task) => task.id === taskId);

    if (taskIndex === -1) {
      return undefined;
    }

    const [deletedTask] = this.tasks.splice(taskIndex, 1);
    return this.createSnapshot(deletedTask);
  }

  private createSnapshot(task: Task): Task {
    return { ...task };
  }
}

const globalForTaskStore = globalThis as typeof globalThis & {
  taskStore?: TaskStore;
};

// Keep one in-memory collection for server rendering and API route calls in this process.
export const taskStore = globalForTaskStore.taskStore ?? new TaskStore();
globalForTaskStore.taskStore = taskStore;
