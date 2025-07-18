import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes.js";
import { setupVite, serveStatic, log } from "./vite.js";
import { runMigrations, initializeDefaultData } from "./migrate.js";
import path from "path";
import { fileURLToPath } from "url";

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
import { config } from "dotenv";
config();

const app = express();

// Simple CORS setup for development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', '*');
  res.header('Access-Control-Allow-Headers', '*');
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
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
  // Run database migrations and initialize default data
  await runMigrations();
  await initializeDefaultData();
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    // Production static file serving with fixed paths
    const distPath = path.resolve(__dirname, "..", "dist", "public");
    
    // Check if built files exist, if not try alternative paths
    if (!require('fs').existsSync(distPath)) {
      console.log(`Build directory not found at ${distPath}, trying alternative paths...`);
      
      // Try the build output directory
      const altPath = path.resolve(__dirname, "..", "dist");
      if (require('fs').existsSync(altPath)) {
        app.use(express.static(altPath));
      } else {
        console.error('No build directory found, serving minimal response');
        app.use('*', (req, res) => {
          res.json({ message: 'CrossPost Pro API is running', timestamp: new Date().toISOString() });
        });
      }
    } else {
      app.use(express.static(distPath));
    }
    
    // Fallback for SPA routing in production
    app.use("*", (req, res) => {
      const indexPath = path.resolve(distPath, "index.html");
      if (require('fs').existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.json({ message: 'CrossPost Pro API is running', timestamp: new Date().toISOString() });
      }
    });
  }

  // Serve the app on the configured port (Railway uses PORT env var)
  const port = parseInt(process.env.PORT || "5000");
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();
