
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./lib/routes";
import { setupVite, serveStatic, log } from "./lib/vite";

const app = express();

// Security middleware
app.use((req, res, next) => {
  // Basic security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        // Only log response for non-sensitive data
        if (!path.includes('/users') || res.statusCode >= 400) {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        } else {
          logLine += ` :: [response hidden]`;
        }
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    // Add request logging middleware to debug what's happening
    app.use((req: Request, res: Response, next: NextFunction) => {
      log(`📥 ${req.method} ${req.path}`);
      next();
    });

    const server = await registerRoutes(app);

    // 404 handler for unmatched API routes
    app.use('/api/*', (req: Request, res: Response) => {
      res.status(404).json({ error: 'API endpoint not found' });
    });

    // Setup Vite or static serving - importantly only after setting up all API routes
    // so the catch-all route doesn't interfere with the other routes
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // Global error handler - must be after all middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      // Log the full error for debugging
      if (status >= 500) {
        console.error('Server Error:', err);
      }

      res.status(status).json({
        error: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
      });
    });

    // Start server
    const port = 5000;
    server.listen(port, "0.0.0.0", () => {
      log(`🚀 Server running on port ${port}`);
      log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      log(`🗄️  Database: ${process.env.VITE_SUPABASE_URL ? 'Connected' : 'Not configured'}`);
    });

    server.on('error', (error) => {
      console.error('Server error:', error);
    });


    // Graceful shutdown handling
    process.on('SIGTERM', () => {
      log('SIGTERM received, shutting down gracefully');
      server.close(() => {
        log('Process terminated');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();