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

export enum Player {
  X = 'X',
  O = 'O'
}

export type GameState = {
  id: string;
  board: (Player | null)[];
  currentTurn: Player;
  winner: Player | null;
  players: string[];
  hostPlayer: Player | null; // Track the host player to control sharing
}

export type GameMessage = 
  | { type: 'Join', game_id: string }
  | { type: 'Move', position: number }
  | { type: 'RequestAIMove' }
  | { type: 'Update', game: GameState, player: Player }
  | { type: 'Error', message: string }
  | { type: 'ConnectionStatus', status: 'connected' | 'disconnected' | 'reconnecting' };