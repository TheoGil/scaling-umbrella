import { Howl } from "howler";

import audioSpritesUrl from "/audio-sprites.mp3?url";
import slidingAudioLoopUrl from "/sliding.mp3?url";
import { emitter } from "./emitter";
import { DEBUG_PARAMS } from "../settings";

let globalMuted = false;

const audioSprites = new Howl({
  src: [audioSpritesUrl],
  sprite: {
    fall1: [20, 110],
    fall2: [520, 180],
    fall3: [1031, 315],
    obstacle: [1567, 1957],
    pill: [4037, 523],
    ui: [4620, 58],
  },
});

const sliding = new Howl({
  src: [slidingAudioLoopUrl],
  loop: true,
  autoplay: true,
  volume: 0,
});

emitter.on("game_playerLeaveGround", () => {
  // Fade out sliding loop
  sliding.fade(
    DEBUG_PARAMS.audio.sliding.volume,
    0,
    DEBUG_PARAMS.audio.sliding.fadeOutTime
  );
});

emitter.on("game_playerGroundBack", () => {
  // Fade in sliding loop
  sliding.fade(
    0,
    DEBUG_PARAMS.audio.sliding.volume,
    DEBUG_PARAMS.audio.sliding.fadeInTime
  );

  // Play a random impact sound
  const randomImpactId = `fall${Math.ceil(Math.random() * 3)}`;
  audioSprites.play(randomImpactId);
});

emitter.on("game_playerObstacleCollision", () => {
  audioSprites.play("obstacle");
});

emitter.on("game_playerPillCollision", () => {
  audioSprites.play("pill");
});

emitter.on("ui_click", () => {
  audioSprites.play("ui");
});

emitter.on("ui_toggleAudio", () => {
  globalMuted = !globalMuted;
  Howler.mute(globalMuted);
});
