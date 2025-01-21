import { Pane, FolderApi } from "tweakpane";
import * as EssentialsPlugin from "@tweakpane/plugin-essentials";

import { DEBUG_PARAMS } from "../settings";
import { App } from "..";
import { Render } from "matter-js";
import { pillManager } from "./Pill";
import { cameraManager } from "./cameraManager";

function initDebug(app: App) {
  if (!window.location.search.includes("debug")) {
    return;
  }

  const debug = new Pane() as FolderApi;
  debug.registerPlugin(EssentialsPlugin);

  // PLAYER
  const playerFolder = debug.addFolder({
    title: "Player",
    expanded: false,
  });

  playerFolder.addBinding(DEBUG_PARAMS.player.velocity, "x", {
    label: "Speed",
    min: 0,
    max: 20,
  });

  const playerJumpFolder = playerFolder.addFolder({
    title: "Jump",
    expanded: false,
  });

  playerJumpFolder.addBinding(DEBUG_PARAMS.player.velocity, "jump", {
    label: "Vel",
    min: -20,
    max: 0,
  });

  playerJumpFolder.addBinding(DEBUG_PARAMS.player.variableJump, "maxTime", {
    label: "Max jump time (ms)",
    min: 0,
    max: 1000,
  });

  const playerSlowdownFolder = playerFolder.addFolder({
    title: "Slowdown",
    expanded: false,
  });

  playerSlowdownFolder.addBinding(DEBUG_PARAMS.player.slowdown, "duration", {
    label: "Duration (s)",
    min: 0,
    max: 5,
  });

  playerSlowdownFolder.addBinding(
    DEBUG_PARAMS.player.slowdown,
    "timeToMaxVel",
    {
      label: "Time to max vel (s)",
      min: 0,
      max: 5,
    }
  );

  const playerAutorotateFolder = playerFolder.addFolder({
    title: "Auto-rotate",
    expanded: false,
  });

  playerAutorotateFolder.addBinding(
    DEBUG_PARAMS.player,
    "autoRotateLerpAmount",
    {
      label: "Lerp",
      min: 0,
      max: 1,
      step: 0.001,
    }
  );

  if (app.player) {
    const playerPhysicsFolder = playerFolder.addFolder({
      title: "Physics",
      expanded: false,
    });

    playerPhysicsFolder.addBinding(
      app.player.physicsBody.parts[1],
      "restitution"
    );
    playerPhysicsFolder.addBinding(app.player.physicsBody.parts[1], "friction");
    playerPhysicsFolder.addBinding(
      app.player.physicsBody.parts[1],
      "frictionStatic"
    );
  }

  // TERRAIN
  const terrainFolder = debug
    .addFolder({
      title: "Terrain",
      expanded: false,
    })
    .on("change", () => {
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

  const gravityFolder = debug.addFolder({
    title: "Gravity",
    expanded: false,
  });

  gravityFolder.addBinding(DEBUG_PARAMS.physics.gravity, "falling", {
    label: "Falling",
    min: 0,
    max: 10,
  });

  gravityFolder.addBinding(DEBUG_PARAMS.physics.gravity, "jumping", {
    label: "Jumping",
    min: 0,
    max: 10,
  });

  gravityFolder.addBinding(DEBUG_PARAMS.physics.gravity, "grounded", {
    label: "Grounded",
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

  cameraFolder
    .addBinding(DEBUG_PARAMS.camera, "cameraName", {
      view: "list",
      label: "camera",
      options: [
        { text: "main", value: "perspectiveCamera" },
        { text: "debug", value: "debugCamera" },
      ],
    })
    .on("change", () => {
      cameraManager.cameraHelper.visible =
        DEBUG_PARAMS.camera.cameraName === "debugCamera";
    });

  cameraFolder.addBinding(DEBUG_PARAMS.camera, "followPlayer");
  cameraFolder.addBinding(DEBUG_PARAMS.camera, "lerp", {
    min: 0,
    max: 1,
    label: "lerp",
  });

  const cameraPortraitFolder = cameraFolder.addFolder({
    title: "Portrait",
    expanded: false,
  });

  const cameraPortraitStartFolder = cameraPortraitFolder.addFolder({
    title: "Startscreen",
    expanded: false,
  });
  cameraPortraitStartFolder.addBinding(
    DEBUG_PARAMS.camera.portrait.startscreen,
    "z",
    {
      step: 1,
      max: 1000,
      min: 50,
    }
  );
  cameraPortraitStartFolder.addBinding(
    DEBUG_PARAMS.camera.portrait.startscreen,
    "x",
    {
      step: 1,
      min: -500,
      max: 500,
    }
  );
  cameraPortraitStartFolder.addBinding(
    DEBUG_PARAMS.camera.portrait.startscreen,
    "y",
    {
      step: 1,
      min: -500,
      max: 500,
    }
  );

  const cameraPortraitGameFolder = cameraPortraitFolder.addFolder({
    title: "Playing",
    expanded: false,
  });
  cameraPortraitGameFolder.addBinding(
    DEBUG_PARAMS.camera.portrait.playing,
    "z",
    {
      step: 1,
      max: 1000,
      min: 100,
    }
  );
  cameraPortraitGameFolder.addBinding(
    DEBUG_PARAMS.camera.portrait.playing,
    "x",
    {
      step: 1,
      min: -500,
      max: 500,
    }
  );
  cameraPortraitGameFolder.addBinding(
    DEBUG_PARAMS.camera.portrait.playing,
    "y",
    {
      step: 1,
      min: -500,
      max: 500,
    }
  );

  const cameraPortraitCompleteFolder = cameraPortraitFolder.addFolder({
    title: "Complete",
    expanded: false,
  });
  cameraPortraitCompleteFolder.addBinding(
    DEBUG_PARAMS.camera.portrait.completed,
    "z",
    {
      step: 1,
      max: 1000,
      min: 100,
    }
  );
  cameraPortraitCompleteFolder.addBinding(
    DEBUG_PARAMS.camera.portrait.completed,
    "x",
    {
      step: 1,
      min: -500,
      max: 500,
    }
  );
  cameraPortraitCompleteFolder.addBinding(
    DEBUG_PARAMS.camera.portrait.completed,
    "y",
    {
      step: 1,
      min: -500,
      max: 500,
    }
  );

  const cameraLandscapeFolder = cameraFolder.addFolder({
    title: "Landscape",
    expanded: false,
  });

  const cameraLandscapeStartFolder = cameraLandscapeFolder.addFolder({
    title: "Startscreen",
    expanded: false,
  });
  cameraLandscapeStartFolder.addBinding(
    DEBUG_PARAMS.camera.landscape.startscreen,
    "z",
    {
      step: 1,
      max: 1000,
      min: 50,
    }
  );
  cameraLandscapeStartFolder.addBinding(
    DEBUG_PARAMS.camera.landscape.startscreen,
    "x",
    {
      step: 1,
      min: -500,
      max: 500,
    }
  );
  cameraLandscapeStartFolder.addBinding(
    DEBUG_PARAMS.camera.landscape.startscreen,
    "y",
    {
      step: 1,
      min: -500,
      max: 500,
    }
  );

  const cameraLandscapePlayingFolder = cameraLandscapeFolder.addFolder({
    title: "Playing",
    expanded: false,
  });
  cameraLandscapePlayingFolder.addBinding(
    DEBUG_PARAMS.camera.landscape.playing,
    "z",
    {
      step: 1,
      max: 1000,
      min: 100,
    }
  );
  cameraLandscapePlayingFolder.addBinding(
    DEBUG_PARAMS.camera.landscape.playing,
    "x",
    {
      step: 1,
      min: -500,
      max: 500,
    }
  );
  cameraLandscapePlayingFolder.addBinding(
    DEBUG_PARAMS.camera.landscape.playing,
    "y",
    {
      step: 1,
      min: -500,
      max: 500,
    }
  );

  const cameraLandscapeCompleteFolder = cameraLandscapeFolder.addFolder({
    title: "Complete",
    expanded: false,
  });
  cameraLandscapeCompleteFolder.addBinding(
    DEBUG_PARAMS.camera.landscape.completed,
    "z",
    {
      step: 1,
      max: 1000,
      min: 100,
    }
  );
  cameraLandscapeCompleteFolder.addBinding(
    DEBUG_PARAMS.camera.landscape.completed,
    "x",
    {
      step: 1,
      min: -500,
      max: 500,
    }
  );
  cameraLandscapeCompleteFolder.addBinding(
    DEBUG_PARAMS.camera.landscape.completed,
    "y",
    {
      step: 1,
      min: -500,
      max: 500,
    }
  );

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

  if (app.trailFX) {
    const trailFXFolder = debug.addFolder({
      title: "Trail FX",
      expanded: false,
    });
    trailFXFolder.addBinding(app.trailFX.object3D, "visible", {
      label: "debug",
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
    trailFXFolder.addBinding(
      app.trailFX.floorSimMat.uniforms.uBanding,
      "value",
      {
        label: "banding",
        min: 0,
        max: 0.1,
        step: 0.0001,
      }
    );
  }

  const backgroundFolder = debug.addFolder({
    title: "Background",
    expanded: false,
  });

  backgroundFolder.addBinding(DEBUG_PARAMS.background.plane, "z", {
    label: "depth",
    min: -1000,
    max: 0,
  });

  backgroundFolder.addBinding(DEBUG_PARAMS.background.plane, "scrollSpeed", {
    label: "scrollspeed",
    min: 0,
    step: 0.0005,
  });

  const pillLensFlare = debug
    .addFolder({
      title: "Pill lens flare",
      expanded: false,
    })
    .on("change", () => {
      pillManager.pills.forEach((p) => {
        for (let i = 0; i < 3; i++) {
          p.planes[i].material.uniforms.uStep.value =
            DEBUG_PARAMS.pills.flares.layers[i].step;

          p.planes[i].material.uniforms.uEdge.value =
            DEBUG_PARAMS.pills.flares.layers[i].edges;

          p.planes[i].material.uniforms.uSpeed.value =
            DEBUG_PARAMS.pills.flares.layers[i].speed;

          p.planes[i].scale.set(
            DEBUG_PARAMS.pills.flares.layers[i].scale,
            DEBUG_PARAMS.pills.flares.layers[i].scale,
            1
          );
        }
      });
    });

  for (let index = 0; index < 3; index++) {
    const f = pillLensFlare.addFolder({
      title: `Layer ${index}`,
      expanded: false,
    });

    f.addBinding(DEBUG_PARAMS.pills.flares.layers[0], "step", {
      min: 0,
      max: 1,
    });

    f.addBinding(DEBUG_PARAMS.pills.flares.layers[0], "edges", {
      min: 0,
      max: 0.25,
    });

    f.addBinding(DEBUG_PARAMS.pills.flares.layers[0], "speed", {
      min: 0,
      max: 0.001,
      step: 0.00001,
    });

    f.addBinding(DEBUG_PARAMS.pills.flares.layers[0], "scale", {
      min: 0,
      max: 10,
    });
  }

  const particlesFolder = debug.addFolder({
    title: "Particles",
    expanded: false,
  });

  initParticlesFolder(particlesFolder, "sliding");
  initParticlesFolder(particlesFolder, "landing");
  initParticlesFolder(particlesFolder, "obstacle");

  const pillParticles = particlesFolder.addFolder({
    title: "pill",
    expanded: false,
  });
  pillParticles.addBinding(DEBUG_PARAMS.particles.pill, "count", {
    min: 0,
    step: 1,
  });

  pillParticles.addBinding(DEBUG_PARAMS.particles.pill, "scale", {
    min: 0,
    step: 1,
  });

  pillParticles.addBinding(DEBUG_PARAMS.particles.pill, "lifetime", {
    min: 0,
    step: 1,
  });

  const pillParticlesVelocity = pillParticles.addFolder({
    title: "Velocity",
  });
  pillParticlesVelocity.addBinding(DEBUG_PARAMS.particles.pill.velocity, "x", {
    min: 0,
    step: 1,
  });
  pillParticlesVelocity.addBinding(DEBUG_PARAMS.particles.pill.velocity, "y", {
    min: 0,
    step: 1,
  });
  pillParticlesVelocity.addBinding(DEBUG_PARAMS.particles.pill.velocity, "z", {
    min: 0,
    step: 1,
  });

  const pillParticlesAcceleration = pillParticles.addFolder({
    title: "Acceleration",
  });
  pillParticlesAcceleration.addBinding(
    DEBUG_PARAMS.particles.pill.acceleration,
    "x",
    {
      min: 0,
      step: 1,
    }
  );
  pillParticlesAcceleration.addBinding(
    DEBUG_PARAMS.particles.pill.acceleration,
    "y",
    {
      min: 0,
      step: 1,
    }
  );
  pillParticlesAcceleration.addBinding(
    DEBUG_PARAMS.particles.pill.acceleration,
    "z",
    {
      min: 0,
      step: 1,
    }
  );
}

function initParticlesFolder(
  root: FolderApi,
  type: "sliding" | "landing" | "obstacle"
) {
  const folder = root.addFolder({
    title: type,
    expanded: false,
  });

  folder.addBinding(DEBUG_PARAMS.particles[type], "enabled");

  folder.addBinding(DEBUG_PARAMS.particles[type], "count", {
    min: 0,
    step: 1,
  });

  folder.addBinding(DEBUG_PARAMS.particles[type], "speed", {
    step: 1,
    min: 0,
    max: 20,
  });

  folder.addBinding(DEBUG_PARAMS.particles[type], "scale", {
    step: 1,
  });

  folder.addBinding(DEBUG_PARAMS.particles[type], "lifetime");

  folder.addBinding(DEBUG_PARAMS.particles[type], "gravity");

  const velFolder = folder.addFolder({
    title: "Velocity",
    expanded: true,
  });

  velFolder.addBinding(DEBUG_PARAMS.particles[type].velocity, "x", {
    step: 1,
  });

  velFolder.addBinding(DEBUG_PARAMS.particles[type].velocity, "y", {
    step: 1,
  });

  velFolder.addBinding(DEBUG_PARAMS.particles[type].velocity, "z", {
    step: 1,
  });

  const colors = DEBUG_PARAMS.particles[type].colors.map(
    (c) => `#${c.clone().convertSRGBToLinear().getHexString()}`
  );

  const colorFolder = folder
    .addFolder({
      title: "Colors",
      expanded: true,
    })
    .on("change", () => {
      DEBUG_PARAMS.particles[type].colors.forEach((c, i) => {
        c.set(colors[i]);
      });
    });

  colors.forEach((_c, i) => {
    colorFolder.addBinding(colors, i.toString());
  });
}

export { initDebug };
