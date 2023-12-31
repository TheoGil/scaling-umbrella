import "./style.css";

import { AUTO, Scale, Game, Input, GameObjects } from "phaser";
import { Pane, FolderApi } from "tweakpane";
import PhaserMatterCollisionPlugin from "phaser-matter-collision-plugin";

import { TerrainChunk, Player } from "./modules";
import { PARAMS } from "./params";

class PrototypeScene extends Phaser.Scene {
  chunks: TerrainChunk[] = [];
  bodies: [] = [];
  player: any;
  spacebar?: Input.Keyboard.Key;
  graphics!: GameObjects.Graphics;
  matterCollision: any;

  constructor() {
    super("PrototypeScene");
  }

  create() {
    this.graphics = this.add.graphics();
    this.spacebar = this.input.keyboard?.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
    );

    this.initTerrainChunks();
    this.initDebug();
    this.initPlayer();
  }

  update() {
    if (!this.matter.world.enabled) {
      return;
    }

    this.player.update();
  }

  initTerrainChunks() {
    this.chunks = [];

    let x = 0;
    let y = 0;

    for (let i = 0; i < PARAMS.chunks.count; i++) {
      const chunk = new TerrainChunk(x, y, this);

      this.chunks.push(chunk);

      x = chunk.right;
      y = chunk.bottom;
    }
  }

  reset() {
    this.graphics.clear();

    // Clean previous terrain chunks
    this.chunks.forEach((chunk) => {
      chunk.destroy();
    });
    this.chunks = [];

    // Build new terrain chunks
    this.initTerrainChunks();

    // Reset player position and velocity
    this.player.reset();
  }

  initPlayer() {
    this.player = new Player(this);
  }

  initDebug() {
    const pane = new Pane() as FolderApi;

    pane
      .addButton({
        title: "PAUSE",
      })
      .on("click", () => {
        if (this.matter.world.enabled) {
          this.matter.world.pause();
        } else {
          this.matter.world.resume();
        }
      });

    pane
      .addButton({
        title: "RESTART",
      })
      .on("click", () => {
        this.reset();
      });

    /**
     * TERRAIN CHUNKS
     */

    const chunksFolder = pane
      .addFolder({
        title: "Terrain chunks",
        expanded: false,
      })
      .on("change", () => {
        this.reset();
      });

    const angleFolder = chunksFolder.addFolder({
      title: "Angle",
    });
    angleFolder.addBinding(PARAMS.chunks.angle, "min", {
      min: 0,
      max: 90,
      step: 1,
    });
    angleFolder.addBinding(PARAMS.chunks.angle, "max", {
      min: 0,
      max: 90,
      step: 1,
    });

    const diagonalFolder = chunksFolder.addFolder({
      title: "Diagonal",
    });

    diagonalFolder.addBinding(PARAMS.chunks.diagonal, "min", {
      min: 0,
      max: 1000,
      step: 1,
    });
    diagonalFolder.addBinding(PARAMS.chunks.diagonal, "max", {
      min: 0,
      max: 1000,
      step: 1,
    });

    const noiseFolder = chunksFolder.addFolder({
      title: "Noise",
    });

    noiseFolder.addBinding(PARAMS.chunks.noise, "amplitude", {
      min: 0,
      max: 100,
      step: 1,
    });

    noiseFolder.addBinding(PARAMS.chunks.noise, "frequency", {
      min: 0,
      max: 0.01,
      step: 0.0001,
    });

    chunksFolder.addBinding(PARAMS.chunks, "subdivisions", {
      min: 10,
      max: 100,
      step: 1,
    });

    chunksFolder.addBinding(PARAMS.chunks, "count", {
      min: 1,
      max: 100,
      step: 1,
    });

    /**
     * CAMERA
     */

    const cameraFolder = pane.addFolder({
      title: "Camera",
      expanded: false,
    });

    const cameraOffsetFolder = cameraFolder.addFolder({
      title: "Offset",
    });

    cameraOffsetFolder.addBinding(PARAMS.camera.offset, "x", {
      step: 10,
    });
    cameraOffsetFolder.addBinding(PARAMS.camera.offset, "y", {
      step: 10,
    });

    /**
     * PLAYER
     */

    const playerFolder = pane.addFolder({
      title: "Player",
      expanded: false,
    });

    playerFolder.addBinding(PARAMS.player, "terrainRotationLerp", {
      min: 0,
      max: 1,
      label: "rot lerp",
    });

    const playerVelocityFolder = playerFolder.addFolder({
      title: "Velocity",
    });

    playerVelocityFolder.addBinding(PARAMS.player.velocity, "x", {
      min: 0,
      max: 10,
    });

    playerVelocityFolder.addBinding(PARAMS.player.velocity, "jump", {
      min: -10,
      max: 0,
    });
  }
}

new Game({
  type: AUTO,
  // backgroundColor: 0x75d5e3,
  scale: {
    mode: Scale.FIT,
    width: 1334,
    height: 750,
  },
  physics: {
    default: "matter",
    matter: {
      debug: true,
    },
  },
  scene: PrototypeScene,
  plugins: {
    scene: [
      {
        plugin: PhaserMatterCollisionPlugin, // The plugin class
        key: "matterCollision", // Where to store in Scene.Systems, e.g. scene.sys.matterCollision
        mapping: "matterCollision", // Where to store in the Scene, e.g. scene.matterCollision
      },
    ],
  },
});

export { PrototypeScene };
