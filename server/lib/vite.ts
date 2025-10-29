// Vite development server setup and static serving helpers
import type { Express } from "express";
import type { Server } from "http";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function log(message: string) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

export async function setupVite(app: Express, _server: Server) {
  try {
    const { createServer } = await import("vite");

    const clientRoot = path.resolve(__dirname, "../../client");
    log(`Client root: ${clientRoot}`);

    // Create Vite server with minimal inline config to avoid async config pitfalls
    const vite = await createServer({
      server: {
        middlewareMode: true,
        hmr: { port: 24678 },
      },
      appType: "spa",
      root: clientRoot,
      configFile: false,
      plugins: [
        (await import("@vitejs/plugin-react")).default(),
      ],
      resolve: {
        alias: {
          "@": path.resolve(clientRoot, "src"),
          "@shared": path.resolve(__dirname, "../../shared"),
          "@assets": path.resolve(__dirname, "../../attached_assets"),
        },
      },
    });

    app.use(vite.ssrFixStacktrace);
    app.use(vite.middlewares);

    log("Vite development server middleware configured");
  } catch (error) {
    log(`Vite setup failed: ${error}`);
    throw error;
  }
}

export function serveStatic(app: Express) {
  // Serve static files from the production build directory (root vite build -> dist/public)
  const clientBuildPath = path.resolve(process.cwd(), "dist", "public");
  app.use(express.static(clientBuildPath));

  // Handle SPA routing - send index.html for all non-API routes
  app.get("*", (req: any, res: any) => {
    if (!req.path.startsWith("/api")) {
      res.sendFile(path.join(clientBuildPath, "index.html"));
    }
  });

  log(`Static files served from ${clientBuildPath}`);
}

