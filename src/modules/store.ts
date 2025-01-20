import { atom } from "nanostores";

export type GameState = "startscreen" | "playing" | "completed";

const $gameState = atom<GameState>("startscreen");

const gameIsPlaying = () => $gameState.get() === "playing";

const $terrainChunkIndex = atom<number>(0);

const $allPillsCollected = atom<boolean>(false);

export { $gameState, gameIsPlaying, $terrainChunkIndex, $allPillsCollected };
