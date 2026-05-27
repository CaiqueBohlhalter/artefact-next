import { describe, expect, it } from "vitest";
import { createTRPCRouter } from "@/server/trpc/init";
import { createTaskRouter } from "./task.router";
import { TaskStore } from "./task.store";

function createCaller() {
  const router = createTRPCRouter({
    task: createTaskRouter(new TaskStore()),
  });

  return router.createCaller({});
}

describe("taskRouter", () => {
  it("creates and lists a task with normalized details", async () => {
    const caller = createCaller();

    const createdTask = await caller.task.create({
      title: "  Write documentation  ",
      description: "  ",
    });
    const tasks = await caller.task.list();

    expect(createdTask).toMatchObject({
      title: "Write documentation",
      description: undefined,
    });
    expect(createdTask.id).toEqual(expect.any(String));
    expect(createdTask.createdAt).toEqual(expect.any(String));
    expect(tasks).toEqual([createdTask]);
  });

  it("rejects task creation without a title", async () => {
    const caller = createCaller();

    await expect(caller.task.create({ title: "   " })).rejects.toThrow(
      "Title is required.",
    );
  });

  it("updates an existing task", async () => {
    const caller = createCaller();
    const createdTask = await caller.task.create({ title: "Original title" });

    const updatedTask = await caller.task.update({
      id: createdTask.id,
      title: "Updated title",
      description: "Updated details",
    });

    expect(updatedTask).toMatchObject({
      id: createdTask.id,
      title: "Updated title",
      description: "Updated details",
      createdAt: createdTask.createdAt,
    });
  });

  it("returns a meaningful error when updating an unknown task", async () => {
    const caller = createCaller();

    await expect(
      caller.task.update({
        id: crypto.randomUUID(),
        title: "Missing task",
      }),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Task not found.",
    });
  });

  it("deletes an existing task and rejects a second deletion", async () => {
    const caller = createCaller();
    const createdTask = await caller.task.create({ title: "Remove this" });

    const deletedTask = await caller.task.delete({ id: createdTask.id });

    expect(deletedTask).toEqual(createdTask);
    await expect(
      caller.task.delete({ id: createdTask.id }),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Task not found.",
    });
    await expect(caller.task.list()).resolves.toEqual([]);
  });
});
