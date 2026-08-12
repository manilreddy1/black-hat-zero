import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/sponsor-logo")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const path = url.searchParams.get("p") ?? "";
        if (!path || path.includes("..") || !/^[\w./-]+$/.test(path)) {
          return new Response("Bad request", { status: 400 });
        }
        const { admin } = await import("@/lib/db.server");
        const db = await admin();
        const { data, error } = await db.storage.from("sponsor-logos").download(path);
        if (error || !data) return new Response("Not found", { status: 404 });
        const buf = await data.arrayBuffer();
        return new Response(buf, {
          headers: {
            "Content-Type": data.type || "image/png",
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      },
    },
  },
});
