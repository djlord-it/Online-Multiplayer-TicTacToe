// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";
import { WebSocketServer } from "ws";

// server/game_manager.ts
import { WebSocket } from "ws";
import { v4 as uuidv4 } from "uuid";

// shared/schema.ts
import { pgTable, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var games = pgTable("games", {
  id: varchar("id").primaryKey(),
  board: text("board").array().notNull(),
  currentTurn: varchar("current_turn").notNull(),
  winner: varchar("winner"),
  players: text("players").array().notNull(),
  hostPlayer: varchar("host_player")
  // Track who created the game
});
var gameInsertSchema = createInsertSchema(games);

// server/game_manager.ts
var GameManager = class {
  games;
  connections;
  constructor() {
    this.games = /* @__PURE__ */ new Map();
    this.connections = /* @__PURE__ */ new Map();
  }
  createGame() {
    const id = uuidv4().slice(0, 8);
    this.games.set(id, {
      id,
      board: Array(9).fill(null),
      currentTurn: "X" /* X */,
      winner: null,
      players: [],
      hostPlayer: "X" /* X */
      // X is always the host when creating a new game
    });
    this.connections.set(id, /* @__PURE__ */ new Map());
    return id;
  }
  joinGame(gameId, ws) {
    const game = this.games.get(gameId);
    if (!game) return null;
    const connections = this.connections.get(gameId);
    let assignedPlayer = null;
    if (!connections.has("X" /* X */)) {
      connections.set("X" /* X */, ws);
      assignedPlayer = "X" /* X */;
      game.players.push("X" /* X */);
      game.hostPlayer = "X" /* X */;
    } else if (!connections.has("O" /* O */)) {
      connections.set("O" /* O */, ws);
      assignedPlayer = "O" /* O */;
      game.players.push("O" /* O */);
    }
    return assignedPlayer;
  }
  getCurrentPlayer(gameId, ws) {
    const connections = this.connections.get(gameId);
    if (!connections) return null;
    for (const [player, connection] of connections) {
      if (connection === ws) {
        return player;
      }
    }
    return null;
  }
  makeMove(gameId, position, player) {
    const game = this.games.get(gameId);
    if (!game || game.currentTurn !== player || game.winner) return false;
    if (position < 0 || position >= 9 || game.board[position]) return false;
    game.board[position] = player;
    this.checkWinner(game);
    game.currentTurn = player === "X" /* X */ ? "O" /* O */ : "X" /* X */;
    return true;
  }
  broadcastGameState(gameId) {
    const game = this.games.get(gameId);
    const connections = this.connections.get(gameId);
    if (!game || !connections) return;
    connections.forEach((ws, player) => {
      if (ws.readyState === WebSocket.OPEN) {
        const message = {
          type: "Update",
          game,
          player
        };
        ws.send(JSON.stringify(message));
      }
    });
  }
  checkWinner(game) {
    const winningCombos = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6]
    ];
    for (const combo of winningCombos) {
      const [a, b, c] = combo;
      if (game.board[a] && game.board[a] === game.board[b] && game.board[b] === game.board[c]) {
        game.winner = game.board[a];
        return;
      }
    }
    if (game.board.every((cell) => cell !== null)) {
      game.winner = null;
    }
  }
  handleDisconnect(gameId, ws) {
    const connections = this.connections.get(gameId);
    if (!connections) return;
    connections.forEach((conn, player) => {
      if (conn === ws) {
        connections.delete(player);
      }
    });
  }
};
var gameManager = new GameManager();

// server/routes.ts
function registerRoutes(app2) {
  const httpServer = createServer(app2);
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });
  wss.on("connection", (ws) => {
    let currentGameId = null;
    ws.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString());
        switch (message.type) {
          case "Join": {
            currentGameId = message.game_id || gameManager.createGame();
            const player = gameManager.joinGame(currentGameId, ws);
            if (player) {
              ws.send(JSON.stringify({
                type: "ConnectionStatus",
                status: "connected"
              }));
              gameManager.broadcastGameState(currentGameId);
            } else {
              ws.send(JSON.stringify({
                type: "Error",
                message: "Game is full or invalid"
              }));
            }
            break;
          }
          case "Move": {
            if (!currentGameId) {
              ws.send(JSON.stringify({
                type: "Error",
                message: "Not in a game"
              }));
              return;
            }
            const moveResult = gameManager.makeMove(
              currentGameId,
              message.position,
              gameManager.getCurrentPlayer(currentGameId, ws)
            );
            if (moveResult) {
              gameManager.broadcastGameState(currentGameId);
            } else {
              ws.send(JSON.stringify({
                type: "Error",
                message: "Invalid move"
              }));
            }
            break;
          }
        }
      } catch (err) {
        console.error("WebSocket message error:", err);
        ws.send(JSON.stringify({
          type: "Error",
          message: "Invalid message format"
        }));
      }
    });
    ws.on("close", () => {
      if (currentGameId) {
        gameManager.handleDisconnect(currentGameId, ws);
        gameManager.broadcastGameState(currentGameId);
      }
    });
  });
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2, { dirname as dirname2 } from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path, { dirname } from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
var vite_config_default = defineConfig({
  plugins: [react(), runtimeErrorOverlay(), themePlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared")
    }
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "client", "dist"),
    // Fix output directory
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = dirname2(__filename2);
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        __dirname2,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(__dirname2, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const PORT = 8e3;
  server.listen(PORT, "0.0.0.0", () => {
    log(`Server running at http://0.0.0.0:${PORT}`);
  });
})();
