import { Composite, Engine } from "matter-js";
import { TerrainChunk } from "./TerrainChunk";

class Terrain {
  physicsEngine: Engine;
  chunks: TerrainChunk[] = [];

  constructor(options: { physicsEngine: Engine }) {
    this.physicsEngine = options.physicsEngine;

    this.initTerrainChunks();
  }

  initTerrainChunks() {
    let x = 200;
    let y = 200;

    for (let i = 0; i < 100; i++) {
      const chunk = new TerrainChunk(x, y);
      this.chunks.push(chunk);
      Composite.add(this.physicsEngine.world, chunk.bodies);
      x = chunk.bbox.right;
      y = chunk.bbox.bottom;
    }
  }
}

export { Terrain };
