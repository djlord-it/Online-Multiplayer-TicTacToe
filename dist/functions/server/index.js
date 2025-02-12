// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";
import { WebSocketServer } from "ws";

// server/game_manager.ts
var WebSocketManager = class {
  connections = /* @__PURE__ */ new Map();
  games = /* @__PURE__ */ new Map();
  playerGames = /* @__PURE__ */ new Map();
  handleConnection(connectionId, ws) {
    this.connections.set(connectionId, ws);
  }
  handleDisconnection(connectionId) {
    const gameId = this.playerGames.get(connectionId);
    if (gameId) {
      const game = this.games.get(gameId);
      if (game) {
        if (game.player1?.id === connectionId) game.player1.connected = false;
        if (game.player2?.id === connectionId) game.player2.connected = false;
        this.broadcastGameState(gameId);
      }
    }
    this.connections.delete(connectionId);
    this.playerGames.delete(connectionId);
  }
  handleMessage(connectionId, message) {
    switch (message.type) {
      case "Join":
        this.handleJoin(connectionId, message.game_id);
        break;
      case "Move":
        this.handleMove(connectionId, message.position);
        break;
      case "RequestReplay":
        this.handleReplayRequest(connectionId);
        break;
      case "AcceptReplay":
        this.handleReplayAccept(connectionId);
        break;
    }
  }
  handleJoin(connectionId, gameId = "") {
    let targetGameId = gameId;
    if (!targetGameId) {
      targetGameId = Math.random().toString(36).substring(2, 8);
      this.games.set(targetGameId, {
        id: targetGameId,
        board: Array(9).fill(null),
        currentPlayer: "X",
        winner: null,
        player1: { id: connectionId, symbol: "X", connected: true },
        status: "waiting"
      });
    } else {
      const game = this.games.get(targetGameId);
      if (game && !game.player2) {
        game.player2 = { id: connectionId, symbol: "O", connected: true };
        game.status = "playing";
      }
    }
    this.playerGames.set(connectionId, targetGameId);
    this.broadcastGameState(targetGameId);
  }
  handleMove(connectionId, position) {
    const gameId = this.playerGames.get(connectionId);
    if (!gameId) return;
    const game = this.games.get(gameId);
    if (!game || game.winner || game.board[position] !== null) return;
    const player = game.player1?.id === connectionId ? game.player1 : game.player2;
    if (!player || game.currentPlayer !== player.symbol) return;
    game.board[position] = player.symbol;
    game.currentPlayer = game.currentPlayer === "X" ? "O" : "X";
    const winner = this.checkWinner(game.board);
    if (winner) {
      game.winner = winner;
      game.status = "finished";
    } else if (!game.board.includes(null)) {
      game.status = "draw";
    }
    this.broadcastGameState(gameId);
  }
  handleReplayRequest(connectionId) {
    const gameId = this.playerGames.get(connectionId);
    if (!gameId) return;
    const game = this.games.get(gameId);
    if (!game) return;
    game.replayRequested = true;
    this.broadcastGameState(gameId);
  }
  handleReplayAccept(connectionId) {
    const gameId = this.playerGames.get(connectionId);
    if (!gameId) return;
    const game = this.games.get(gameId);
    if (!game) return;
    game.board = Array(9).fill(null);
    game.currentPlayer = "X";
    game.winner = null;
    game.status = "playing";
    game.replayRequested = false;
    this.broadcastGameState(gameId);
  }
  broadcastGameState(gameId) {
    const game = this.games.get(gameId);
    if (!game) return;
    [game.player1, game.player2].forEach((player) => {
      if (player) {
        const ws = this.connections.get(player.id);
        if (ws) {
          const message = {
            type: "Update",
            game,
            player
          };
          ws.send(JSON.stringify(message));
        }
      }
    });
  }
  checkWinner(board) {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      // lignes
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      // colonnes
      [0, 4, 8],
      [2, 4, 6]
      // diagonales
    ];
    for (const [a, b, c] of lines) {
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }
    return null;
  }
};

// server/routes.ts
var wsManager = new WebSocketManager();
function registerRoutes(app2) {
  const httpServer = createServer(app2);
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });
  wss.on("connection", (ws) => {
    const connectionId = Math.random().toString(36).substring(2);
    wsManager.handleConnection(connectionId, ws);
    ws.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString());
        wsManager.handleMessage(connectionId, message);
      } catch (err) {
        console.error("WebSocket message error:", err);
        ws.send(JSON.stringify({
          type: "Error",
          message: "Invalid message format"
        }));
      }
    });
    ws.on("close", () => {
      wsManager.handleDisconnection(connectionId);
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
    outDir: path.resolve(__dirname, "dist/public"),
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
