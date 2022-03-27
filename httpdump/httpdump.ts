import { serve } from "std/http/server.ts";
import { VERSION } from "std/version.ts";

const defaultHeaders: Record<string, string> = {
  "content-type": "application/json",
  "x-deno-std": VERSION,
};

async function handler(request: Request): Promise<Response> {
  const reqHeaders: Record<string, string> = {};
  request.headers.forEach((v, k) => {
    reqHeaders[k] = v;
  });
  const req = {
    method: request.method,
    url: request.url,
    credentials: request.credentials,
    mode: request.mode,
    headers: reqHeaders,
    redirect: request.redirect,
    body: await request.text(),
  };

  const headers = defaultHeaders;

  if (Deno.version !== undefined) {
    headers["x-deno"] = Deno.version.deno;
    headers["x-deno-v8"] = Deno.version.v8;
    headers["x-deno-ts"] = Deno.version.typescript;
  }

  const region = Deno.env.get("DENO_REGION")
  if (region != undefined && region != "") {
    headers["x-deno-region"] = region
  }

  return new Response(JSON.stringify(req), { headers });
}

console.log("Listening on http://localhost:8000");
serve(handler);
