import { createTRPCRouter } from "./init";
import { taskRouter } from "@/server/tasks/task.router";

export const appRouter = createTRPCRouter({
  task: taskRouter,
});

export type AppRouter = typeof appRouter;

export function createServerCaller() {
  return appRouter.createCaller({});
}
