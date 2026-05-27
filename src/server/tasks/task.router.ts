import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/trpc/init";
import { TASK_LIST_PAGE_SIZE } from "./task.constants";
import { taskStore, type TaskStore } from "./task.store";

const taskDetailsSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required.")
    .max(120, "Title must be 120 characters or fewer."),
  description: z
    .string()
    .trim()
    .max(1000, "Description must be 1000 characters or fewer.")
    .optional()
    .transform((value) => value || undefined),
});

const taskIdSchema = z.object({
  id: z.string().uuid("Invalid task id."),
});

const taskPageInputSchema = z.object({
  cursor: z.number().int().nonnegative().nullish(),
  limit: z.number().int().positive().max(50).default(TASK_LIST_PAGE_SIZE),
});

function createTaskNotFoundError() {
  return new TRPCError({
    code: "NOT_FOUND",
    message: "Task not found.",
  });
}

export function createTaskRouter(taskStoreInstance: TaskStore) {
  return createTRPCRouter({
    list: publicProcedure.query(() => taskStoreInstance.list()),

    listPage: publicProcedure
      .input(taskPageInputSchema)
      .query(({ input }) =>
        taskStoreInstance.listPage(input.cursor ?? undefined, input.limit),
      ),

    getById: publicProcedure.input(taskIdSchema).query(({ input }) => {
      const requestedTask = taskStoreInstance.findById(input.id);

      if (!requestedTask) {
        throw createTaskNotFoundError();
      }

      return requestedTask;
    }),

    create: publicProcedure.input(taskDetailsSchema).mutation(({ input }) => {
      return taskStoreInstance.create(input);
    }),

    update: publicProcedure
      .input(taskIdSchema.extend(taskDetailsSchema.shape))
      .mutation(({ input }) => {
        const updatedTask = taskStoreInstance.update(input.id, input);

        if (!updatedTask) {
          throw createTaskNotFoundError();
        }

        return updatedTask;
      }),

    delete: publicProcedure.input(taskIdSchema).mutation(({ input }) => {
      const deletedTask = taskStoreInstance.delete(input.id);

      if (!deletedTask) {
        throw createTaskNotFoundError();
      }

      return deletedTask;
    }),
  });
}

export const taskRouter = createTaskRouter(taskStore);
