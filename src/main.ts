import "./style.css";

import { AUTO, Scale, Game } from "phaser";
import { Pane } from "tweakpane";

import { TerrainChunk } from "./modules";
import { PARAMS } from "./params";

class PrototypeScene extends Phaser.Scene {
  chunks: TerrainChunk[] = [];
  bodies: [] = [];

  constructor() {
    super("PrototypeScene");
  }

  create() {
    this.initTerrainChunks();
    this.initDebug();
  }

  initTerrainChunks() {
    this.chunks = [];

    const CHUNK_COUNT = 5;

    let x = 0;
    let y = 0;

    for (let i = 0; i < CHUNK_COUNT; i++) {
      const chunk = new TerrainChunk(x, y, this);

      this.chunks.push(chunk);

      x = chunk.right;
      y = chunk.bottom;
    }
  }

  resetTerrainChunks() {
    this.chunks.forEach((chunk) => {
      chunk.destroy();
    });
    this.chunks = [];
    this.initTerrainChunks();
  }

  initDebug() {
    const pane = new Pane();

    const f = pane
      .addFolder({
        title: "Chunks",
      })
      .on("change", () => {
        this.resetTerrainChunks();
      });

    const angleFolder = f.addFolder({
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

    const diagonalFolder = f.addFolder({
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

    f.addBinding(PARAMS.chunks, "subdivisions", {
      min: 10,
      max: 100,
      step: 1,
    });

    const noiseFolder = f.addFolder({
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

    f.addButton({
      title: "Redraw",
    }).on("click", () => {
      this.resetTerrainChunks();
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
});
