import "dotenv/config";
import express from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from "path";

// Global error handlers for production stability
process.on('unhandledRejection', (reason) => {
  console.error('SERVER_UNHANDLED_REJECTION:', reason);
});
process.on('uncaughtException', (error) => {
  console.error('SERVER_UNCAUGHT_EXCEPTION:', error);
});

const app = express();
// Re-enabled database connection with stability hardening
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: false, limit: "50mb" }));

// Standard logger
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      log(`${req.method} ${path} ${res.statusCode} in ${duration}ms`);
    }
  });
  next();
});

// Top-level initialization
// This ensures routes and DB are ready before the server starts
const server = await registerRoutes(app);

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
  console.error("SERVER_ERROR_CAUGHT:", err);
});

if (process.env.NODE_ENV === "development") {
  await setupVite(app, server);
} else {
  // Static serving for standalone mode (non-Vercel production)
  if (!process.env.VERCEL) {
    serveStatic(app);
  }
}

// Port listener (only for non-Vercel)
if (!process.env.VERCEL) {
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({ port, host: "0.0.0.0" }, () => {
    log(`serving on port ${port}`);
  });
}

// Vercel entry point
export default app;
