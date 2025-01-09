import {
  Body,
  Composite,
  Engine,
  Events,
  IEventCollision,
  Render,
  Runner,
} from "matter-js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import "./style.css";
import {
  MathUtils,
  Scene,
  Vector3,
  PerspectiveCamera,
  WebGLRenderer,
  Texture,
  Mesh,
  BufferGeometry,
  ShaderMaterial,
  MeshBasicMaterial,
} from "three";

import { Player } from "./modules/Player";
import { TerrainChunk } from "./modules/TerrainChunk";
import { getCameraFrustrumDimensionsAtDepth } from "./utils/getCameraFrustrumDimensionsAtDepth";
import { emitter } from "./modules/emitter";
import { initDebug } from "./modules/debug";
import { DEBUG_PARAMS } from "./settings";
import { AssetsManager } from "./modules/AssetsManager";

const dummyVec3 = new Vector3();

import colorMaskRGBTextureURL from "/color-mask-red-blue-green.png?url";
import colorMaskPWYTextureURL from "/color-mask-purple-white-yellow.png?url";
import noiseTextureURL from "/noise_1.jpg?url";
import sceneGLBUrl from "/lic.glb?url";
import { Background } from "./modules/Background";
import { Trail } from "./modules/Trail";
import { parseScene } from "./modules/parseScene";

class App {
  matterEngine!: Engine;
  matterRenderer!: Render;
  runner!: Runner;

  scene!: Scene;
  camera!: PerspectiveCamera;
  renderer!: WebGLRenderer;
  assetsManager = new AssetsManager();

  models!: {
    background: Mesh<BufferGeometry, ShaderMaterial>;
    player: Mesh<BufferGeometry, MeshBasicMaterial>;
  };
  materials!: {
    colorMaskMaterial: ShaderMaterial;
    basicMaterial: MeshBasicMaterial;
  };

  player!: Player;
  terrainChunks: TerrainChunk[] = [];
  latestTerrainChunkIndex = 0;
  background!: Background;
  trailFX!: Trail;

  constructor() {
    this.onAfterTick = this.onAfterTick.bind(this);
    this.onCollisionStart = this.onCollisionStart.bind(this);
    this.onCollisionEnd = this.onCollisionEnd.bind(this);
    this.onResize = this.onResize.bind(this);
    this.onPlayerCollideWithObstacle =
      this.onPlayerCollideWithObstacle.bind(this);
    this.onRAF = this.onRAF.bind(this);

    this.init();

    window.addEventListener("resize", this.onResize);

    emitter.on(
      "onPlayerCollisionWithObstacle",
      this.onPlayerCollideWithObstacle
    );

    this.onRAF();
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
    if (DEBUG_PARAMS.debugRenderer.enabled) {
      Render.run(this.matterRenderer);
    }

    this.runner = Runner.create();

    Runner.run(this.runner, this.matterEngine);
    Events.on(this.runner, "afterTick", this.onAfterTick);
  }

  initRendering() {
    this.scene = new Scene();

    this.camera = new PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      1,
      5000
    );

    this.renderer = new WebGLRenderer({
      canvas: document.getElementById("webgl-canvas") as HTMLCanvasElement,
      antialias: true,
      preserveDrawingBuffer: true,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    new OrbitControls(this.camera, this.renderer.domElement);
  }

  async init() {
    await this.loadAssets();
    this.initRendering();
    this.initPhysics();
    this.initTerrain();
    this.initPlayer();

    this.trailFX = new Trail(
      this.renderer,
      this.assetsManager.get<Texture>("noise_1"),
      this.camera
    );
    this.scene.add(this.trailFX.object3D);

    this.background = new Background(
      this.models.background as Mesh<BufferGeometry, ShaderMaterial>
    );
    this.scene.add(this.background.background);

    initDebug(this);
  }

  async loadAssets() {
    this.assetsManager.add({
      id: "LIC",
      src: sceneGLBUrl,
      type: "gltf",
    });

    this.assetsManager.add({
      id: "noise_1",
      src: noiseTextureURL,
      type: "texture",
    });

    this.assetsManager.add({
      id: "color-mask-rgb",
      src: colorMaskRGBTextureURL,
      type: "texture",
    });

    this.assetsManager.add({
      id: "color-mask-pwy",
      src: colorMaskPWYTextureURL,
      type: "texture",
    });

    await this.assetsManager.loadAll();

    const { models, materials } = parseScene(this.assetsManager);
    this.models = models;
    this.materials = materials;
  }

  initTerrain() {
    const initialChunksCount = 2;
    let chunkX = 0;
    let chunkY = innerHeight / 2;
    for (let i = 0; i < initialChunksCount; i++) {
      const terrainChunk = this.initTerrainChunk(chunkX, chunkY);

      chunkX =
        terrainChunk.curve.points[terrainChunk.curve.points.length - 1].x +
        MathUtils.randFloat(
          DEBUG_PARAMS.terrain.gaps.min,
          DEBUG_PARAMS.terrain.gaps.max
        );
      chunkY =
        terrainChunk.curve.points[terrainChunk.curve.points.length - 1].y;
    }
  }

  initPlayer() {
    this.player = new Player(this.models.player);
    Composite.add(this.matterEngine.world, [this.player.physicsBody]);
    Composite.add(this.matterEngine.world, [this.player.terrainAngleSensor]);
    this.scene.add(this.player.object3D);
  }

  initTerrainChunk(x: number, y: number) {
    const terrainChunk = new TerrainChunk(x, y, this.latestTerrainChunkIndex);
    this.latestTerrainChunkIndex++;

    Composite.add(this.matterEngine!.world, terrainChunk.bodies);
    this.scene.add(terrainChunk.object3D);

    terrainChunk.obstacles.forEach((obstacle) => {
      Composite.add(this.matterEngine!.world, obstacle.physicsBody);
      this.scene.add(obstacle.object3D);
    });

    this.terrainChunks.push(terrainChunk);

    return terrainChunk;
  }

  focusCameraOnPlayer() {
    const isPortrait = innerWidth < innerHeight;

    const z = isPortrait
      ? DEBUG_PARAMS.camera.portrait.z
      : DEBUG_PARAMS.camera.landscape.z;

    const offsetX = isPortrait
      ? DEBUG_PARAMS.camera.portrait.offset.x
      : DEBUG_PARAMS.camera.landscape.offset.x;

    const offsetY = isPortrait
      ? DEBUG_PARAMS.camera.portrait.offset.y
      : DEBUG_PARAMS.camera.landscape.offset.y;

    this.camera?.position.set(
      this.player.object3D.position.x + offsetX,
      this.player.object3D.position.y + offsetY,
      z
    );

    dummyVec3.set(this.camera.position.x, this.camera.position.y, 0);
    this.camera.lookAt(dummyVec3);
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

      if (chunk.boundingBox && frustumX > chunk.boundingBox.max.x) {
        // Cleanup chunk mesh, physic bodies...
        Composite.remove(this.matterEngine!.world, chunk.bodies);
        this.scene.remove(chunk.object3D);
        chunk.obstacles.forEach((obstacle) => {
          Composite.add(this.matterEngine!.world, obstacle.physicsBody);
          this.scene.add(obstacle.object3D);
        });

        this.terrainChunks.splice(i, 1);

        // Create new one
        const lastChunk = this.terrainChunks[this.terrainChunks.length - 1];
        const curveLastPoint =
          lastChunk.curve.points[lastChunk.curve.points.length - 1];
        this.initTerrainChunk(
          curveLastPoint.x +
            MathUtils.randFloat(
              DEBUG_PARAMS.terrain.gaps.min,
              DEBUG_PARAMS.terrain.gaps.max
            ),
          curveLastPoint.y
        );
      }
    }
  }

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

    this.player.update();

    if (DEBUG_PARAMS.webgl.enabled) {
      this.renderer.render(this.scene!, this.camera!);
    }
  }

  onCollisionStart(e: IEventCollision<Engine>) {
    emitter.emit("onCollisionStart", e);
  }

  onCollisionEnd(e: IEventCollision<Engine>) {
    emitter.emit("onCollisionEnd", e);
  }

  reset() {
    for (let i = this.terrainChunks.length - 1; i >= 0; i--) {
      Composite.remove(this.matterEngine!.world, this.terrainChunks[i].bodies);
      this.scene.remove(this.terrainChunks[i].object3D);
    }
    this.terrainChunks = [];

    this.initTerrain();

    this.player.reset();
    Body.setPosition(this.player.physicsBody, {
      x: this.terrainChunks[0].curve.points[0].x + 10,
      y: this.terrainChunks[0].curve.points[0].y - 200,
    });
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  onPlayerCollideWithObstacle() {
    // Temporary visual flash fx to give player feedback when colliding with obstacle
    // TODO: Determine what happens when player collides with obstacle
    console.log("BONK 💥");
  }

  onRAF() {
    if (DEBUG_PARAMS.camera.followPlayer && this.player) {
      this.focusCameraOnPlayer();
    }

    if (this.trailFX && this.player) {
      this.trailFX.update({
        origin: {
          x: this.player.object3D.position.x,
          y: this.player.object3D.position.y,
        },
        movement: {
          x: this.player.movement.x / innerWidth,
          y: (this.player.movement.y / innerHeight) * 0.5,
        },
      });
    }

    if (this.background) {
      // TODO: Properly handle scaling and positioning of mesh so that it covers the whole viewport without magic numbers.
      // To ease things a bit, mesh should be re-exported with origin at center
      this.background.background.scale.setScalar(75);
      this.background.background.position.set(
        this.camera.position.x,
        this.camera.position.y - 250,
        DEBUG_PARAMS.background.plane.z
      );

      // Update the trail mask texture value since there is ping pong at play
      // other wise it will only display every 2 frames
      this.materials.colorMaskMaterial.uniforms.uTrailMask.value =
        this.trailFX.bufferSim.output.texture;
    }

    requestAnimationFrame(this.onRAF);
  }
}

export { App };

new App();
