import { Howl } from "howler";

import audioSpritesUrl from "/audio-sprites.mp3?url";
import slidingAudioLoopUrl from "/sliding.mp3?url";
import { emitter } from "./emitter";
import { DEBUG_PARAMS } from "../settings";

const audioManager = {
  mute: false,
  audioSprites: new Howl({
    src: [audioSpritesUrl],
    sprite: {
      fall1: [20, 110],
      fall2: [520, 180],
      fall3: [1031, 315],
      obstacle: [1567, 1957],
      pill: [4037, 523],
      ui: [4620, 58],
    },
  }),
  sliding: new Howl({
    src: [slidingAudioLoopUrl],
    loop: true,
    volume: DEBUG_PARAMS.audio.sliding.volume,
  }),
  init() {
    emitter.on("game_playerLeaveGround", () => {
      audioManager.sliding.pause();
    });

    emitter.on("game_playerGroundBack", () => {
      audioManager.sliding.play();

      // Play a random impact sound
      const randomImpactId = `fall${Math.ceil(Math.random() * 3)}`;
      audioManager.audioSprites.play(randomImpactId);
    });

    emitter.on("game_playerObstacleCollision", () => {
      audioManager.audioSprites.play("obstacle");
    });

    emitter.on("game_playerPillCollision", () => {
      audioManager.audioSprites.play("pill");
    });

    emitter.on("ui_click", () => {
      audioManager.audioSprites.play("ui");
    });

    emitter.on("ui_toggleAudio", () => {
      audioManager.mute = !audioManager.mute;
      Howler.mute(audioManager.mute);
    });
  },
};

export { audioManager };
