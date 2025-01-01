import { Pane, FolderApi } from "tweakpane";
import * as EssentialsPlugin from "@tweakpane/plugin-essentials";
import {
  Composite,
  Engine,
  Events,
  IEventCollision,
  Render,
  Runner,
} from "matter-js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import "./style.css";
import { PerspectiveCamera, Scene, WebGLRenderer } from "three";
import { DEBUG_PARAMS } from "./settings";
import { Player } from "./modules/Player";
import { TerrainChunk } from "./modules/TerrainChunk";
import { getCameraFrustrumDimensionsAtDepth } from "./utils/getCameraFrustrumDimensionsAtDepth";
import { emitter } from "./modules/emitter";

const debug = new Pane() as FolderApi;
debug.registerPlugin(EssentialsPlugin);

debug.addBinding(DEBUG_PARAMS, "p", {
  min: 0,
  max: 1,
  step: 0.001,
  label: "Progress",
});
/*
const curveFolder = debug
  .addFolder({
    title: "Curve segments",
  })
  .on("change", () => {
    curve = initCurve();
  });

curveFolder.addBinding(DEBUG_PARAMS.segments, "angle", {
  min: 0,
  max: Math.PI / 2,
  label: "Angle",
});

curveFolder.addBinding(DEBUG_PARAMS.segments, "alternateAngle", {
  label: "Alternate angle",
});

curveFolder.addBinding(DEBUG_PARAMS.segments, "length", {
  min: 0,
  max: 400,
  label: "Length",
});

*/
////////////////
////////////////

class App {
  matterEngine!: Engine;
  matterRenderer!: Render;
  runner!: Runner;
  scene!: Scene;
  camera!: PerspectiveCamera;
  renderer!: WebGLRenderer;
  player!: Player;
  terrainChunks: TerrainChunk[] = [];

  constructor() {
    this.onAfterTick = this.onAfterTick.bind(this);
    this.onCollisionStart = this.onCollisionStart.bind(this);
    this.onCollisionEnd = this.onCollisionEnd.bind(this);

    this.initRendering();
    this.initPhysics();
    this.init();
  }

  initPhysics() {
    this.matterEngine = Engine.create();
    Events.on(this.matterEngine, "collisionStart", this.onCollisionStart);
    Events.on(this.matterEngine, "collisionEnd", this.onCollisionEnd);

    this.matterRenderer = Render.create({
      canvas: document.getElementById("matter-canvas") as HTMLCanvasElement,
      engine: this.matterEngine,
      options: {
        width: innerWidth,
        height: innerHeight,
        wireframeBackground: "transparent",
        wireframes: true,
      },
    });
    Render.run(this.matterRenderer);

    this.runner = Runner.create();

    Runner.run(this.runner, this.matterEngine);
    Events.on(this.runner, "afterTick", this.onAfterTick);
  }

  initRendering() {
    this.scene = new Scene();

    this.camera = new PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.z = -5;

    this.renderer = new WebGLRenderer({
      canvas: document.getElementById("webgl-canvas") as HTMLCanvasElement,
      antialias: true,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    new OrbitControls(this.camera, this.renderer.domElement);
  }

  init() {
    const initialChunksCount = 2;
    let chunkX = 0;
    let chunkY = innerHeight / 2;
    for (let i = 0; i < initialChunksCount; i++) {
      const terrainChunk = this.initTerrainChunk(chunkX, chunkY);

      chunkX =
        terrainChunk.curve.points[terrainChunk.curve.points.length - 1].x;
      chunkY =
        terrainChunk.curve.points[terrainChunk.curve.points.length - 1].y;
    }

    this.player = new Player();
    Composite.add(this.matterEngine.world, [this.player.physicsBody]);
    Composite.add(this.matterEngine.world, [this.player.terrainAngleSensor]);
    this.scene.add(this.player.object3D);
  }

  initTerrainChunk(x: number, y: number) {
    const terrainChunk = new TerrainChunk(x, y);

    Composite.add(this.matterEngine!.world, terrainChunk.bodies);
    this.scene.add(terrainChunk.mesh);

    this.terrainChunks.push(terrainChunk);

    return terrainChunk;
  }

  focusCameraOnPlayer() {
    this.camera?.position.set(
      this.player.object3D.position.x,
      this.player.object3D.position.y,
      300
    );

    this.camera.lookAt(this.player.object3D.position);
  }

  // Iterate over terrain chunks and destroy them once they leave the viewport
  // Leave the viewport === left edge of camera frustum > right edge of chunk BBox
  destroyOutOfViewChunks() {
    const { width: cameraFrustrumWidth } = getCameraFrustrumDimensionsAtDepth(
      this.camera,
      0
    );
    const halfFrustumWidth = cameraFrustrumWidth / 2;
    const frustumX = this.camera.position.x - halfFrustumWidth;

    for (let i = this.terrainChunks.length - 1; i >= 0; i--) {
      const chunk = this.terrainChunks[i];

      if (
        chunk.mesh.geometry.boundingBox &&
        frustumX > chunk.mesh.geometry.boundingBox.max.x
      ) {
        // Cleanup chunk mesh, physic bodies...
        Composite.remove(this.matterEngine!.world, chunk.bodies);
        this.scene.remove(chunk.mesh);

        this.terrainChunks.splice(i, 1);

        // Create new one
        const lastChunk = this.terrainChunks[this.terrainChunks.length - 1];
        const curveLastPoint =
          lastChunk.curve.points[lastChunk.curve.points.length - 1];
        this.initTerrainChunk(curveLastPoint.x, curveLastPoint.y);
      }
    }
  }

  // Fired once at the end of the browser frame, after beforeTick, tick and after any engine updates.
  onAfterTick() {
    Render.lookAt(
      this.matterRenderer,
      {
        position: {
          x: this.player.physicsBody.position.x,
          y: this.player.physicsBody.position.y,
        },
      },
      {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      }
    );

    this.destroyOutOfViewChunks();

    // The Y axis is inverted in canvas 2D / threejs space
    this.player.object3D.position.set(
      this.player.physicsBody.position.x,
      -this.player.physicsBody.position.y,
      0
    );

    this.player.update();
    this.focusCameraOnPlayer();

    this.renderer.render(this.scene!, this.camera!);
  }

  onCollisionStart(e: IEventCollision<Engine>) {
    emitter.emit("onCollisionStart", e);
  }

  onCollisionEnd(e: IEventCollision<Engine>) {
    emitter.emit("onCollisionEnd", e);
  }
}

new App();
