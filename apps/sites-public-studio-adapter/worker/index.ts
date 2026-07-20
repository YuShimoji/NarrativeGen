import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
}

interface WorkerExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

export default {
  async fetch(request: Request, env: Env, ctx: WorkerExecutionContext): Promise<Response> {
    return handler.fetch(request, env, ctx);
  },
};
