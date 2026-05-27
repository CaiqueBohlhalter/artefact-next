import { initTRPC } from "@trpc/server";
import { z } from "zod";

export function createTRPCContext() {
  return {};
}

type Context = ReturnType<typeof createTRPCContext>;

const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        validationErrors:
          error.cause instanceof z.ZodError
            ? (z.flattenError(error.cause).fieldErrors as Record<
                string,
                string[] | undefined
              >)
            : null,
      },
    };
  },
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
