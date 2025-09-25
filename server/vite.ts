import express, { type Express } from "express";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer, createLogger } from "vite";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        __dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "..", "client");
  console.log(`[PROD_STATIC] Serving from calculated path: ${distPath}`);

  if (!fs.existsSync(distPath)) {
    const errorMsg = `[PROD_STATIC_ERROR] Build directory NOT FOUND at ${distPath}`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
  console.log(`[PROD_STATIC] Build directory FOUND at ${distPath}`);

  const indexPath = path.resolve(distPath, "index.html");
  if (!fs.existsSync(indexPath)) {
    const errorMsg = `[PROD_STATIC_ERROR] index.html NOT FOUND at ${indexPath}`;
    console.error(errorMsg);
    // Listar o conteúdo do diretório para depuração
    try {
      const files = fs.readdirSync(distPath);
      console.log(`[PROD_STATIC_DEBUG] Contents of ${distPath}: ${files.join(", ")}`);
    } catch (e: any) {
      console.error(`[PROD_STATIC_DEBUG] Could not read directory ${distPath}: ${e.message}`);
    }
    throw new Error(errorMsg);
  }
  console.log(`[PROD_STATIC] index.html FOUND at ${indexPath}`);

  app.use(express.static(distPath));

  app.get("*", (_req, res) => {
    res.sendFile(indexPath);
  });
}
