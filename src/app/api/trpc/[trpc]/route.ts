import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server/trpc/app-router";
import { createTRPCContext } from "@/server/trpc/init";

function handleTRPCRequest(request: Request) {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: request,
    router: appRouter,
    createContext: createTRPCContext,
  });
}

export { handleTRPCRequest as GET, handleTRPCRequest as POST };
