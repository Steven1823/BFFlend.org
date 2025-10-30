import express, { type Request, type Response, type NextFunction } from "express";
import { registerRoutes } from "./lib/routes";
import { setupVite, serveStatic, log } from "./lib/vite";

const app = express();

// Security headers
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// API request/response logging (compact)
app.use((req, res, next) => {
  const start = Date.now();
  const reqPath = req.path;
  let captured: unknown = undefined;

  const originalJson = res.json.bind(res);
  (res as any).json = (body: unknown, ...args: any[]) => {
    captured = body;
    return originalJson(body as any, ...args);
  };

  res.on("finish", () => {
    const ms = Date.now() - start;
    if (reqPath.startsWith("/api")) {
      let msg = `${req.method} ${reqPath} ${res.statusCode} in ${ms}ms`;
      if (captured) {
        if (!reqPath.includes("/users") || res.statusCode >= 400) {
          try { msg += ` :: ${JSON.stringify(captured)}`; } catch {}
        } else {
          msg += " :: [response hidden]";
        }
      }
      if (msg.length > 80) msg = msg.slice(0, 77) + "...";
      log(msg);
    }
  });

  next();
});

(async () => {
  try {
    // Per-request line
    app.use((req: Request, _res: Response, next: NextFunction) => {
      log(`${req.method} ${req.path}`);
      next();
    });

    const server = await registerRoutes(app);

    // 404 for unmatched API routes
    app.use("/api/*", (_req: Request, res: Response) => {
      res.status(404).json({ error: "API endpoint not found" });
    });

    // Static or Vite dev middleware
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // Global error handler
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err?.status || err?.statusCode || 500;
      const message = err?.message || "Internal Server Error";
      if (status >= 500) console.error("Server Error:", err);
      res.status(status).json({
        error: message,
        ...(process.env.NODE_ENV === "development" && { stack: err?.stack }),
      });
    });

    const port = 5000;
    server.listen(port, "0.0.0.0", () => {
      log(`Server running on port ${port}`);
      log(`Environment: ${process.env.NODE_ENV || "development"}`);
      log(`Database: ${process.env.VITE_SUPABASE_URL ? "Configured" : "Not configured"}`);
    });

    server.on("error", (error) => {
      console.error("Server error:", error);
    });

    // Graceful shutdown
    process.on("SIGTERM", () => {
      log("SIGTERM received, shutting down gracefully");
      server.close(() => {
        log("Process terminated");
        process.exit(0);
      });
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
})();

