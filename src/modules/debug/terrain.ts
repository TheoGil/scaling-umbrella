import { FolderApi } from "tweakpane";
import { App } from "../App";
import { Composite } from "matter-js";
import { SETTINGS } from "../../settings";
import { emitter } from "../emitter";

const initTerrainDebug = (pane: FolderApi, app: App) => {
  const terrainFolder = pane.addFolder({
    title: "Terrain",
    expanded: false,
  });

  const chunkFolder = terrainFolder
    .addFolder({
      title: "Chunks",
    })
    .on("change", () => {
      emitter.emit("resetPlayer");

      app.terrain.chunks.forEach((chunk) => {
        Composite.remove(app.physicsEngine.world, chunk.bodies);
      });
      app.terrain.chunks = [];

      app.terrain.initTerrainChunks();
    });

  const chunkLengthFolder = chunkFolder.addFolder({
    title: "Length",
  });
  chunkLengthFolder.addBinding(SETTINGS.terrain.chunks.diagonal.length, "min");
  chunkLengthFolder.addBinding(SETTINGS.terrain.chunks.diagonal.length, "max");

  const chunkAngleFolder = chunkFolder.addFolder({
    title: "Angle",
  });
  chunkAngleFolder.addBinding(SETTINGS.terrain.chunks.diagonal.angle, "min");
  chunkAngleFolder.addBinding(SETTINGS.terrain.chunks.diagonal.angle, "max");

  const noiseFolder = chunkFolder.addFolder({
    title: "Noise",
  });
  noiseFolder.addBinding(SETTINGS.terrain.chunks.noise, "amp", {
    label: "Amp",
    min: 0,
    max: 200,
    step: 1,
  });
  noiseFolder.addBinding(SETTINGS.terrain.chunks.noise, "freq", {
    label: "Freq",
    min: 0,
    max: 0.01,
    step: 0.0001,
  });
};

export { initTerrainDebug };
