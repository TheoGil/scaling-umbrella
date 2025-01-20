import { atom } from "nanostores";

export type GameState = "startscreen" | "playing" | "completed";

const $gameState = atom<GameState>("startscreen");

const gameIsPlaying = () => $gameState.get() === "playing";

const $terrainChunkIndex = atom<number>(0);

const $allPillsCollected = atom<boolean>(false);

// There's no real need for reactivity here 🤔
const $timer = atom<number>(0);

export {
  $gameState,
  gameIsPlaying,
  $terrainChunkIndex,
  $allPillsCollected,
  $timer,
};
