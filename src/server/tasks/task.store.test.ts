import { describe, expect, it } from "vitest";
import type { Task } from "./task.model";
import { TaskStore } from "./task.store";

type MutableTask = {
  -readonly [Property in keyof Task]: Task[Property];
};

function changeTaskTitle(task: Task, title: string) {
  (task as MutableTask).title = title;
}

describe("TaskStore", () => {
  it("does not retain references supplied through its constructor", () => {
    const initialTask: Task = {
      id: crypto.randomUUID(),
      title: "Initial title",
      createdAt: new Date().toISOString(),
    };
    const taskStore = new TaskStore([initialTask]);

    changeTaskTitle(initialTask, "External change");

    expect(taskStore.findById(initialTask.id)?.title).toBe("Initial title");
  });

  it("does not expose stored state through create or findById results", () => {
    const taskStore = new TaskStore();
    const createdTask = taskStore.create({ title: "Stored title" });

    changeTaskTitle(createdTask, "Changed create result");
    const retrievedTask = taskStore.findById(createdTask.id);
    expect(retrievedTask?.title).toBe("Stored title");

    if (!retrievedTask) {
      throw new Error("Expected the task to exist.");
    }

    changeTaskTitle(retrievedTask, "Changed retrieval result");
    expect(taskStore.findById(createdTask.id)?.title).toBe("Stored title");
  });

  it("does not expose stored state through list or update results", () => {
    const taskStore = new TaskStore();
    const createdTask = taskStore.create({ title: "Original title" });
    const updatedTask = taskStore.update(createdTask.id, {
      title: "Updated title",
    });

    if (!updatedTask) {
      throw new Error("Expected the task to be updated.");
    }

    changeTaskTitle(updatedTask, "Changed update result");
    const listedTask = taskStore.list()[0];
    expect(listedTask.title).toBe("Updated title");

    changeTaskTitle(listedTask, "Changed list result");
    expect(taskStore.findById(createdTask.id)?.title).toBe("Updated title");
  });

  it("returns task pages in order without exposing stored task references", () => {
    const taskStore = new TaskStore();
    taskStore.create({ title: "First task" });
    taskStore.create({ title: "Second task" });
    taskStore.create({ title: "Third task" });

    const firstPage = taskStore.listPage(undefined, 2);
    const secondPage = taskStore.listPage(firstPage.nextCursor, 2);

    expect(firstPage.tasks.map((task) => task.title)).toEqual([
      "Third task",
      "Second task",
    ]);
    expect(firstPage.nextCursor).toBe(2);
    expect(secondPage.tasks.map((task) => task.title)).toEqual(["First task"]);
    expect(secondPage.nextCursor).toBeUndefined();

    changeTaskTitle(firstPage.tasks[0], "Changed page result");
    expect(taskStore.list()[0].title).toBe("Third task");
  });
});
