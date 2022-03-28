import { serve } from "std/http/server.ts";
import { VERSION } from "std/version.ts";

const headers: Record<string, string> = {
  "content-type": "application/json",
};

if (Deno.version !== undefined) {
  headers["x-deno"] = Deno.version.deno;
  headers["x-deno-v8"] = Deno.version.v8;
  headers["x-deno-ts"] = Deno.version.typescript;
}

headers["x-deno-std"] = VERSION

const region = Deno.env.get("DENO_REGION")
if (region) {
  headers["x-deno-region"] = region
}

async function handler(request: Request): Promise<Response> {
  const reqHeaders: Record<string, string> = {};
  request.headers.forEach((v, k) => {
    reqHeaders[k] = v;
  });
  const url = new URL(request.url);
  const req = {
    method: request.method,
    url: url,
    path: url.pathname,
    credentials: request.credentials,
    mode: request.mode,
    headers: reqHeaders,
    redirect: request.redirect,
    body: await request.text(),
  };

  return new Response(JSON.stringify(req) + "\n", { headers });
}

console.log("Listening on http://localhost:8000");
serve(handler);
