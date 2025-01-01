import { Pane, FolderApi } from "tweakpane";
import * as EssentialsPlugin from "@tweakpane/plugin-essentials";

import { DEBUG_PARAMS } from "../settings";
import { App } from "..";
import { Render, Runner } from "matter-js";

function initDebug(app: App) {
  const debug = new Pane() as FolderApi;
  debug.registerPlugin(EssentialsPlugin);

  // PLAYER
  const playerFolder = debug.addFolder({
    title: "Player",
    expanded: false,
  });
  playerFolder.addBinding(DEBUG_PARAMS.player.velocity, "x", {
    label: "Vel X",
    min: 0,
    max: 20,
  });
  playerFolder.addBinding(DEBUG_PARAMS.player.velocity, "jump", {
    label: "Vel jump",
    min: -20,
    max: 0,
  });

  playerFolder.addBinding(DEBUG_PARAMS.player, "autoRotateLerpAmount", {
    label: "Autorotate lerp",
    min: 0,
    max: 1,
    step: 0.001,
  });

  playerFolder.addBinding(app.player.physicsBody.parts[1], "restitution");
  playerFolder.addBinding(app.player.physicsBody.parts[1], "friction");
  playerFolder.addBinding(app.player.physicsBody.parts[1], "frictionStatic");

  // TERRAIN
  const terrainFolder = debug
    .addFolder({
      title: "Terrain",
      expanded: false,
    })
    .on("change", () => {
      app.reset();
      app.terrainChunks.forEach((chunk) => {
        chunk.bodies.forEach((body) => {
          body.restitution = DEBUG_PARAMS.terrain.restitution;
          body.friction = DEBUG_PARAMS.terrain.friction;
          body.frictionStatic = DEBUG_PARAMS.terrain.frictionStatic;
        });
      });
    });

  terrainFolder.addBinding(DEBUG_PARAMS.segments, "angle", {
    min: -Math.PI / 2,
    max: Math.PI / 2,
    label: "Angle",
  });

  terrainFolder.addBinding(DEBUG_PARAMS.segments, "alternateAngle", {
    label: "Alternate angle",
  });

  terrainFolder.addBinding(DEBUG_PARAMS.segments, "count", {
    min: 5,
    max: 20,
    label: "Points count",
    step: 1,
  });

  terrainFolder.addBinding(DEBUG_PARAMS.segments, "length", {
    min: 0,
    max: 1000,
    label: "Dist between points",
    step: 1,
  });

  terrainFolder.addBinding(DEBUG_PARAMS.segments, "definition", {
    min: 25,
    max: 250,
    label: "Bodies width",
    step: 1,
  });

  terrainFolder.addBinding(DEBUG_PARAMS.terrain, "restitution");
  terrainFolder.addBinding(DEBUG_PARAMS.terrain, "friction");
  terrainFolder.addBinding(DEBUG_PARAMS.terrain, "frictionStatic");

  // Physics
  const physicsFolder = debug.addFolder({
    title: "Physics",
    expanded: false,
  });
  physicsFolder.addBinding(app.runner, "enabled");
  physicsFolder.addBinding(app.matterEngine.gravity, "y", {
    label: "Gravity",
    min: 0,
    max: 10,
  });

  // DEBUG RENDERER
  const debug2DRendererFolder = debug.addFolder({
    title: "Debug renderer",
    expanded: false,
  });
  debug2DRendererFolder
    .addBinding(DEBUG_PARAMS.debugRenderer, "enabled")
    .on("change", () => {
      const canvasEl = document.querySelector(
        "#matter-canvas"
      ) as HTMLCanvasElement;

      if (DEBUG_PARAMS.debugRenderer.enabled) {
        canvasEl.style.opacity = "1";
        Render.run(app.matterRenderer);
      } else {
        canvasEl.style.opacity = "0";
        Render.stop(app.matterRenderer);
      }
    });

  // WEBGL RENDERER
  const webglFolder = debug.addFolder({
    title: "WebGL renderer",
    expanded: false,
  });
  webglFolder.addBinding(DEBUG_PARAMS.webgl, "enabled").on("change", () => {
    (
      document.querySelector("#webgl-canvas") as HTMLCanvasElement
    ).style.opacity = DEBUG_PARAMS.webgl.enabled ? "1" : "0";
  });

  debug
    .addButton({
      title: "Reset",
    })
    .on("click", () => {
      app.reset();
    });

  //   debug.registerPlugin(EssentialsPlugin);
  //   debug.addBinding(DEBUG_PARAMS, "p", {
  //     min: 0,
  //     max: 1,
  //     step: 0.001,
  //     label: "Progress",
  //   });
  //   const curveFolder = debug
  //     .addFolder({
  //       title: "Curve segments",
  //     })
  //     .on("change", () => {
  //       curve = initCurve();
  //     });
  //   curveFolder.addBinding(DEBUG_PARAMS.segments, "angle", {
  //     min: 0,
  //     max: Math.PI / 2,
  //     label: "Angle",
  //   });
  //   curveFolder.addBinding(DEBUG_PARAMS.segments, "alternateAngle", {
  //     label: "Alternate angle",
  //   });
  //   curveFolder.addBinding(DEBUG_PARAMS.segments, "length", {
  //     min: 0,
  //     max: 400,
  //     label: "Length",
  //   });
}

export { initDebug };
