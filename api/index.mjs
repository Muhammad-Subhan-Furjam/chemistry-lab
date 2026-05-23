// Vercel serverless entry — adapts TanStack Start's built SSR handler to Vercel's Node runtime.
// IMPORTANT: import the BUILT server bundle, not the unbundled package entry.
import handler from "../dist/server/server.js";

export const config = { runtime: "nodejs" };

/** @param {import('http').IncomingMessage} req @param {import('http').ServerResponse} res */
export default async function (req, res) {
  try {
    const proto = (req.headers["x-forwarded-proto"] || "https").toString().split(",")[0];
    const host = (req.headers["x-forwarded-host"] || req.headers.host || "localhost").toString();
    const url = new URL(req.url || "/", `${proto}://${host}`);

    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers)) {
      if (Array.isArray(v)) v.forEach((vv) => headers.append(k, vv));
      else if (v != null) headers.set(k, String(v));
    }

    let body;
    const method = (req.method || "GET").toUpperCase();
    if (method !== "GET" && method !== "HEAD") {
      const chunks = [];
      for await (const c of req) chunks.push(c);
      if (chunks.length) body = Buffer.concat(chunks);
    }

    const request = new Request(url, { method, headers, body });
    const fetchFn = handler?.fetch ?? handler;
    const response = await fetchFn(request, process.env, {});

    res.statusCode = response.status;
    response.headers.forEach((value, key) => {
      // Skip headers Node sets automatically
      if (key.toLowerCase() === "content-length") return;
      res.setHeader(key, value);
    });

    if (response.body) {
      const reader = response.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
    }
    res.end();
  } catch (err) {
    console.error("[vercel-adapter] SSR failed:", err);
    res.statusCode = 500;
    res.setHeader("content-type", "text/plain; charset=utf-8");
    res.end(`SSR error: ${err?.message || err}\n${err?.stack || ""}`);
  }
}
