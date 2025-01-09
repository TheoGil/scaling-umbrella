import { Pane, FolderApi } from "tweakpane";
import * as EssentialsPlugin from "@tweakpane/plugin-essentials";

import { DEBUG_PARAMS } from "../settings";
import { App } from "..";
import { Render } from "matter-js";

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

  terrainFolder.addBinding(DEBUG_PARAMS.terrain, "gaps", {
    min: 0,
    max: 500,
    step: 10,
    label: "Gap",
  });

  terrainFolder.addBinding(DEBUG_PARAMS.segments, "angle", {
    min: -Math.PI / 2,
    max: Math.PI / 2,
    label: "Angle",
  });

  terrainFolder.addBinding(
    DEBUG_PARAMS.segments,
    "alternateAngleEveryNTHChunk",
    {
      label: "Alternate angle NTH",
      step: 1,
      min: 0,
      max: 10,
    }
  );

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

  // WEBGL RENDERER
  const cameraFolder = debug.addFolder({
    title: "Camera",
    expanded: false,
  });
  cameraFolder.addBinding(DEBUG_PARAMS.camera, "followPlayer");
  const cameraPortraitFolder = cameraFolder.addFolder({
    title: "Portrait",
    expanded: true,
  });
  cameraPortraitFolder.addBinding(DEBUG_PARAMS.camera.portrait, "z", {
    step: 1,
    max: 1000,
    min: 100,
  });
  cameraPortraitFolder.addBinding(DEBUG_PARAMS.camera.portrait.offset, "x", {
    step: 1,
    min: -500,
    max: 500,
  });
  cameraPortraitFolder.addBinding(DEBUG_PARAMS.camera.portrait.offset, "y", {
    step: 1,
    min: -500,
    max: 500,
  });

  const cameraLandscapeFolder = cameraFolder.addFolder({
    title: "Landscape",
    expanded: true,
  });
  cameraLandscapeFolder.addBinding(DEBUG_PARAMS.camera.landscape, "z", {
    step: 1,
    max: 1000,
    min: 100,
  });
  cameraLandscapeFolder.addBinding(DEBUG_PARAMS.camera.landscape.offset, "x", {
    step: 1,
    min: -500,
    max: 500,
  });
  cameraLandscapeFolder.addBinding(DEBUG_PARAMS.camera.landscape.offset, "y", {
    step: 1,
    min: -500,
    max: 500,
  });

  const colorMaskFolder = debug.addFolder({
    title: "Color Mask",
    expanded: false,
  });

  colorMaskFolder.addBinding(
    app.materials.colorMaskMaterial.uniforms.uDesaturation,
    "value",
    {
      label: "desaturation",
      min: 0,
      max: 1,
    }
  );

  colorMaskFolder.addBinding(
    app.materials.colorMaskMaterial.uniforms.uRedsAmount,
    "value",
    {
      label: "reds",
      min: 0,
      max: 1,
    }
  );

  colorMaskFolder.addBinding(
    app.materials.colorMaskMaterial.uniforms.uBluesAmount,
    "value",
    {
      label: "blues",
      min: 0,
      max: 1,
    }
  );

  colorMaskFolder.addBinding(
    app.materials.colorMaskMaterial.uniforms.uGreensAmount,
    "value",
    {
      label: "greens",
      min: 0,
      max: 1,
    }
  );

  colorMaskFolder.addBinding(
    app.materials.colorMaskMaterial.uniforms.uPurplesAmount,
    "value",
    {
      label: "purples",
      min: 0,
      max: 1,
    }
  );

  colorMaskFolder.addBinding(
    app.materials.colorMaskMaterial.uniforms.uWhitesAmount,
    "value",
    {
      label: "whites",
      min: 0,
      max: 1,
    }
  );

  colorMaskFolder.addBinding(
    app.materials.colorMaskMaterial.uniforms.uYellowsAmount,
    "value",
    {
      label: "yellows",
      min: 0,
      max: 1,
    }
  );

  colorMaskFolder.addBinding(
    app.materials.colorMaskMaterial.uniforms.uNightOverlayOpacity,
    "value",
    {
      label: "overlay alpha",
      min: 0,
      max: 1,
    }
  );

  const trailFXFolder = debug.addFolder({
    title: "Trail FX",
    expanded: false,
  });
  trailFXFolder.addBinding(
    app.trailFX.floorSimMat.uniforms.uThickness,
    "value",
    {
      label: "thickness",
      min: 0,
      max: 0.1,
    }
  );
  trailFXFolder.addBinding(
    app.trailFX.floorSimMat.uniforms.uTraveling,
    "value",
    {
      label: "travelling",
      min: 0,
      max: 1,
    }
  );
  trailFXFolder.addBinding(app.trailFX.floorSimMat.uniforms.uBanding, "value", {
    label: "banding",
    min: 0,
    max: 0.1,
    step: 0.0001,
  });
  // trailFXFolder.addBinding(app.trailFX.object3D.material, "visible", {
  //   label: "debug",
  // });

  const backgroundFolder = debug.addFolder({
    title: "Background",
    expanded: true,
  });

  backgroundFolder.addBinding(DEBUG_PARAMS.background.plane, "z", {
    label: "depth",
    min: -1000,
    max: 0,
  });

  debug
    .addButton({
      title: "Reset",
    })
    .on("click", () => {
      app.reset();
    });
}

export { initDebug };
