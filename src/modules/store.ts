import { atom } from "nanostores";

export type GameState = "startscreen" | "playing" | "completed";

export const $gameState = atom<GameState>("startscreen");

export const gameIsPlaying = () => $gameState.get() === "playing";
