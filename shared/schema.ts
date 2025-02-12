import { pgTable, text, varchar, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const games = pgTable("games", {
  id: varchar("id").primaryKey(),
  board: text("board").array().notNull(),
  currentTurn: varchar("current_turn").notNull(),
  winner: varchar("winner"),
  players: text("players").array().notNull(),
  hostPlayer: varchar("host_player"), // Track who created the game
});

export const gameInsertSchema = createInsertSchema(games);
export type Game = typeof games.$inferSelect;
export type InsertGame = z.infer<typeof gameInsertSchema>;

export type PlayerSymbol = 'X' | 'O';

export interface Player {
  id: string;
  symbol: PlayerSymbol;
  connected: boolean;
}

export interface GameState {
  id: string;
  board: (string | null)[];
  currentPlayer: PlayerSymbol;
  winner: string | null;
  player1?: Player;
  player2?: Player;
  status: 'waiting' | 'playing' | 'finished' | 'draw';
  replayRequested?: boolean;
}

export type GameMessage = 
  | { type: 'Join'; game_id: string }
  | { type: 'Move'; position: number }
  | { type: 'Update'; game: GameState; player: Player }
  | { type: 'Error'; message: string }
  | { type: 'RequestReplay' }
  | { type: 'AcceptReplay' }
  | { type: 'ConnectionStatus'; status: 'connected' | 'disconnected' | 'reconnecting' };