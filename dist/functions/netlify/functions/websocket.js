// netlify/functions/websocket.ts
var games = /* @__PURE__ */ new Map();
var connections = /* @__PURE__ */ new Map();
var playerGames = /* @__PURE__ */ new Map();
var handler = async (event, context) => {
  if (event.requestContext?.eventType === "DISCONNECT") {
    const connectionId2 = event.requestContext.connectionId;
    handleDisconnection(connectionId2);
    return { statusCode: 200 };
  }
  if (!context.websocket) {
    return {
      statusCode: 400,
      body: "Cette fonction n\xE9cessite une connexion WebSocket"
    };
  }
  const { connectionId } = context.websocket;
  if (event.body === null) {
    console.log("Nouvelle connexion WebSocket:", connectionId);
    connections.set(connectionId, context.websocket);
    return { statusCode: 200 };
  }
  try {
    const message = JSON.parse(event.body);
    console.log("Message re\xE7u:", message);
    switch (message.type) {
      case "Join":
        handleJoin(connectionId, message.game_id);
        break;
      case "Move":
        handleMove(connectionId, message.position);
        break;
      case "RequestReplay":
        handleReplayRequest(connectionId);
        break;
      case "AcceptReplay":
        handleReplayAccept(connectionId);
        break;
    }
    return { statusCode: 200 };
  } catch (error) {
    console.error("Erreur lors du traitement du message:", error);
    const ws = connections.get(connectionId);
    if (ws) {
      ws.send(JSON.stringify({
        type: "Error",
        message: "Message invalide"
      }));
    }
    return { statusCode: 400, body: "Message invalide" };
  }
};
function handleDisconnection(connectionId) {
  const gameId = playerGames.get(connectionId);
  if (gameId) {
    const game = games.get(gameId);
    if (game) {
      if (game.player1?.id === connectionId) game.player1.connected = false;
      if (game.player2?.id === connectionId) game.player2.connected = false;
      broadcastGameState(gameId);
    }
  }
  connections.delete(connectionId);
  playerGames.delete(connectionId);
}
function handleJoin(connectionId, gameId = "") {
  let targetGameId = gameId;
  if (!targetGameId) {
    targetGameId = Math.random().toString(36).substring(2, 8);
    games.set(targetGameId, {
      id: targetGameId,
      board: Array(9).fill(null),
      currentPlayer: "X",
      winner: null,
      player1: { id: connectionId, symbol: "X", connected: true },
      status: "waiting"
    });
  } else {
    const game = games.get(targetGameId);
    if (game && !game.player2) {
      game.player2 = { id: connectionId, symbol: "O", connected: true };
      game.status = "playing";
    }
  }
  playerGames.set(connectionId, targetGameId);
  broadcastGameState(targetGameId);
}
function handleMove(connectionId, position) {
  const gameId = playerGames.get(connectionId);
  if (!gameId) return;
  const game = games.get(gameId);
  if (!game || game.winner || game.board[position] !== null) return;
  const player = game.player1?.id === connectionId ? game.player1 : game.player2;
  if (!player || game.currentPlayer !== player.symbol) return;
  game.board[position] = player.symbol;
  game.currentPlayer = game.currentPlayer === "X" ? "O" : "X";
  const winner = checkWinner(game.board);
  if (winner) {
    game.winner = winner;
    game.status = "finished";
  } else if (!game.board.includes(null)) {
    game.status = "draw";
  }
  broadcastGameState(gameId);
}
function handleReplayRequest(connectionId) {
  const gameId = playerGames.get(connectionId);
  if (!gameId) return;
  const game = games.get(gameId);
  if (!game) return;
  game.replayRequested = true;
  broadcastGameState(gameId);
}
function handleReplayAccept(connectionId) {
  const gameId = playerGames.get(connectionId);
  if (!gameId) return;
  const game = games.get(gameId);
  if (!game) return;
  game.board = Array(9).fill(null);
  game.currentPlayer = "X";
  game.winner = null;
  game.status = "playing";
  game.replayRequested = false;
  broadcastGameState(gameId);
}
function broadcastGameState(gameId) {
  const game = games.get(gameId);
  if (!game) return;
  [game.player1, game.player2].forEach((player) => {
    if (player) {
      const ws = connections.get(player.id);
      if (ws) {
        try {
          const message = {
            type: "Update",
            game,
            player
          };
          ws.send(JSON.stringify(message));
        } catch (error) {
          console.error("Erreur lors de l'envoi du message:", error);
        }
      }
    }
  });
}
function checkWinner(board) {
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
export {
  handler
};
