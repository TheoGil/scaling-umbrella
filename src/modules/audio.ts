import { Howl } from "howler";

import audioSpritesUrl from "/audio-sprites.mp3?url";
import slidingAudioLoopUrl from "/sliding.mp3?url";
import backgroundMusicUrl from "/music.mp3?url";
import { emitter } from "./emitter";
import { DEBUG_PARAMS } from "../settings";
import { UI } from "./UI";

const audioManager = {
  mute: false,
  audioSprites: new Howl({
    src: [audioSpritesUrl],
    sprite: {
      bounce: [0, 560], // x
      click: [669, 150], // x
      obstacle: [923, 1050], // x
      flapflap: [2043, 550], // x
      win: [2651, 2500], // x
      honkfall: [5204, 288], // x
      honkpill: [5554, 680], // x
      honk1: [6335, 340], // x
      honk2: [6748, 270], // x
      honk3: [7084, 390], // x
      honk4: [7543, 340], // x
      honk5: [7972, 384], // x
      hover: [8392, 80],
      land: [8500, 270], // x
      pill: [8855, 1400], // x
    },
  }),
  sliding: new Howl({
    src: [slidingAudioLoopUrl],
    loop: true,
    volume: DEBUG_PARAMS.audio.sliding.volume,
  }),
  music: new Howl({
    src: [backgroundMusicUrl],
    loop: true,
    volume: DEBUG_PARAMS.audio.music.volume,
    autoplay: true,
  }),
  init() {
    emitter.on("game_playerLeaveGround", () => {
      audioManager.sliding.pause();
    });

    emitter.on("game_playerGroundBack", () => {
      audioManager.sliding.play();

      audioManager.audioSprites.play("land");
    });

    emitter.on("game_playerJump", () => {
      const randomHonkId = `honk${Math.ceil(Math.random() * 5)}`;
      audioManager.audioSprites.play(randomHonkId);
      audioManager.audioSprites.play("flapflap");
    });

    emitter.on("game_playerBounce", () => {
      audioManager.audioSprites.play("bounce");
    });

    emitter.on("game_playerObstacleCollision", () => {
      audioManager.audioSprites.play("obstacle");
      audioManager.audioSprites.play("honkfall");
    });

    emitter.on("game_playerPillCollision", () => {
      audioManager.audioSprites.play("pill");
      audioManager.audioSprites.play("honkpill");
    });

    emitter.on("ui_click", () => {
      audioManager.audioSprites.play("click");
    });

    emitter.on("ui_toggleAudio", () => {
      audioManager.mute = !audioManager.mute;
      Howler.mute(audioManager.mute);
      UI.audio.updateUI(audioManager.mute);
      localStorage.setItem("mute", audioManager.mute.toString());
    });

    emitter.on("game_complete", () => {
      audioManager.audioSprites.play("win");
    });
  },
};

export { audioManager };
