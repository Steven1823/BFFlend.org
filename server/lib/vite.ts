// Vite development server setup
import type { Express } from "express";
import type { Server } from "http";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function log(message: string) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  try {
    const { createServer } = await import("vite");
    
    const clientRoot = path.resolve(__dirname, "../../client");
    
    log(`📁 Client root: ${clientRoot}`);
    
    // Create Vite server with minimal config to avoid async config issues
    const vite = await createServer({
      server: { 
        middlewareMode: true,
        hmr: { port: 24678 }  // Use different port for HMR
      },
      appType: "spa", 
      root: clientRoot,
      configFile: false,  // Don't use config file to avoid async issues
      plugins: [
        // Minimal inline plugins
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
    
    log("🔧 Vite development server middleware configured");
  } catch (error) {
    log(`❌ Vite setup failed: ${error}`);
    throw error;
  }
}

export function serveStatic(app: Express) {
  const express = require("express");
  const path = require("path");
  
  // Serve static files from the client build directory
  const clientBuildPath = path.resolve(__dirname, "../../client/dist");
  app.use(express.static(clientBuildPath));
  
  // Handle SPA routing - send index.html for all non-API routes
  app.get("*", (req: any, res: any) => {
    if (!req.path.startsWith("/api")) {
      res.sendFile(path.join(clientBuildPath, "index.html"));
    }
  });
  
  log("📦 Static files served from client/dist");
}