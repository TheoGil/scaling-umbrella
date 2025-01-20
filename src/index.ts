import {
  Common,
  Composite,
  Engine,
  Events,
  IEventCollision,
  Render,
} from "matter-js";
import Tempus from "tempus";

import "./style.css";
import {
  MathUtils,
  Scene,
  WebGLRenderer,
  Texture,
  Mesh,
  BufferGeometry,
  ShaderMaterial,
  MeshBasicMaterial,
  Box3,
  Box3Helper,
  Object3D,
  AnimationMixer,
} from "three";

import { Player } from "./modules/Player";
import { TerrainChunk } from "./modules/TerrainChunk";
import { getCameraFrustrumDimensionsAtDepth } from "./utils/getCameraFrustrumDimensionsAtDepth";
import { emitter } from "./modules/emitter";
import { initDebug } from "./modules/debug";
import { DEBUG_PARAMS } from "./settings";
import { AssetsManager } from "./modules/AssetsManager";

import colorMaskRGBTextureURL from "/color-mask-red-blue-green.png?url";
import colorMaskBackgroundTextureURL from "/color-mask-background.png?url";
import colorMaskPWYTextureURL from "/color-mask-purple-white-yellow.png?url";
import noiseTextureURL from "/noise_1.jpg?url";
import sceneGLBUrl from "/lic.glb?url";
import { BackgroundPlane } from "./modules/BackgroundPlane";
import { Trail } from "./modules/Trail";
import { parseScene, PlayerAnimations } from "./modules/parseScene";
import { pillManager } from "./modules/Pill";
import { frustumCuller } from "./modules/frustumCulling";
import gsap from "gsap";

// @ts-expect-error
import decomp from "poly-decomp";
import {
  distributeObstaclesOnTerrainChunk,
  obstacleManager,
} from "./modules/obstacleManager";
import { Particle, ParticleEmitter } from "./modules/particle-emitter";
import { cameraManager } from "./modules/cameraManager";
import {
  gameIsPlaying,
  $gameState,
  $terrainChunkIndex,
  $allPillsCollected,
} from "./modules/store";
import { UI } from "./modules/UI";

class BackgroundFloatingDecoration {
  object3D = new Object3D();
  box = new Box3();
  helper: Box3Helper;

  constructor(mesh: Mesh) {
    this.object3D.add(mesh);

    this.box = new Box3();
    this.box.setFromObject(mesh);

    this.helper = new Box3Helper(this.box, 0xffff00);
    // this.object3D.add(this.helper);
  }
}

class App {
  matterEngine!: Engine;
  matterRenderer!: Render;

  scene!: Scene;

  renderer!: WebGLRenderer;
  assetsManager = new AssetsManager();

  models!: {
    background: Mesh<BufferGeometry, ShaderMaterial>;
    landscape1: Mesh<BufferGeometry, ShaderMaterial>;
    landscape2: Mesh<BufferGeometry, ShaderMaterial>;
    landscape3: Mesh<BufferGeometry, ShaderMaterial>;
    landscape4: Mesh<BufferGeometry, ShaderMaterial>;
    pill1: Mesh<BufferGeometry, MeshBasicMaterial>;
    pill2: Mesh<BufferGeometry, MeshBasicMaterial>;
    pill3: Mesh<BufferGeometry, MeshBasicMaterial>;
    pill4: Mesh<BufferGeometry, MeshBasicMaterial>;
    pill5: Mesh<BufferGeometry, MeshBasicMaterial>;
    pill6: Mesh<BufferGeometry, MeshBasicMaterial>;
    player: Mesh<BufferGeometry, MeshBasicMaterial>;
    obstacle: Mesh<BufferGeometry, MeshBasicMaterial>;
  };
  materials!: {
    colorMaskMaterial: ShaderMaterial;
    backgroundPlaneMaterial: ShaderMaterial;
    basicMaterial: MeshBasicMaterial;
  };
  animationMixer!: AnimationMixer;
  animations!: PlayerAnimations;
  decorations: BackgroundFloatingDecoration[] = [];
  player!: Player;
  terrainChunks: TerrainChunk[] = [];
  latestTerrainChunkIndex = 0;
  backgroundPlane!: BackgroundPlane;
  trailFX!: Trail;

  constructor() {
    this.onCollisionStart = this.onCollisionStart.bind(this);
    this.onCollisionEnd = this.onCollisionEnd.bind(this);
    this.onResize = this.onResize.bind(this);
    this.onPlayerCollideWithObstacle =
      this.onPlayerCollideWithObstacle.bind(this);
    this.onPlayerCollideWithPill = this.onPlayerCollideWithPill.bind(this);
    this.onGameComplete = this.onGameComplete.bind(this);
    this.onFixedUpdate = this.onFixedUpdate.bind(this);
    this.onPlayerSpeedBackUp = this.onPlayerSpeedBackUp.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.onPillLeaveFrustum = this.onPillLeaveFrustum.bind(this);
    this.spawnParticle = this.spawnParticle.bind(this);
    this.startGame = this.startGame.bind(this);
    this.restartGame = this.restartGame.bind(this);

    this.init();

    window.addEventListener("resize", this.onResize);

    emitter.on(
      "onPlayerCollisionWithObstacle",
      this.onPlayerCollideWithObstacle
    );
    emitter.on("onPlayerSpeedBackUp", this.onPlayerSpeedBackUp);
    emitter.on("onPlayerCollisionWithPill", this.onPlayerCollideWithPill);
    emitter.on("onGameComplete", this.onGameComplete);
    emitter.on("onPillLeaveFrustum", this.onPillLeaveFrustum);
    emitter.on("onSpawnParticle", this.spawnParticle);
    emitter.on("ui_startGame", this.startGame);
    emitter.on("ui_restartGame", this.restartGame);

    UI.init();
  }

  initControls() {
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("pointerdown", this.onPointerDown);
    window.addEventListener("pointerup", this.onPointerUp);
  }

  onKeyUp({ code }: KeyboardEvent) {
    if (gameIsPlaying() && code === "Space") {
      emitter.emit("onJumpButtonReleased");
    }
  }

  onKeyDown({ code }: KeyboardEvent) {
    if (gameIsPlaying() && code === "Space") {
      emitter.emit("onJumpButtonPressed");
    }
  }

  onPointerDown(_e: MouseEvent) {
    if (gameIsPlaying()) {
      emitter.emit("onJumpButtonPressed");
    }
  }

  onPointerUp(_e: MouseEvent) {
    if (gameIsPlaying()) {
      emitter.emit("onJumpButtonReleased");
    }
  }

  initPhysics() {
    Common.setDecomp(decomp);

    this.matterEngine = Engine.create({
      positionIterations: 1,
      gravity: {
        y: DEBUG_PARAMS.physics.gravity.grounded,
      },
    });
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

    // this.runner = Runner.create();

    // Runner.run(this.runner, this.matterEngine);
  }

  initRendering() {
    this.scene = new Scene();

    this.renderer = new WebGLRenderer({
      canvas: document.getElementById("webgl-canvas") as HTMLCanvasElement,
      antialias: true,
      preserveDrawingBuffer: true,
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

    cameraManager.init({
      orbitControlDOMElement: this.renderer.domElement,
      scene: this.scene,
    });

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x333333);

    pillManager.init(
      this.models.pill1,
      this.models.pill2,
      this.models.pill3,
      this.models.pill4,
      this.models.pill5,
      this.models.pill6
    );
    this.scene.add(frustumCuller.object3D);
  }

  async init() {
    await this.loadAssets();
    this.initRendering();
    this.initParticleEmitter();
    this.initPhysics();
    this.initObstacleManager();
    this.initTerrain();
    this.initPlayer();
    this.initBackgroundPlane();
    this.initControls();
    this.initTrailFX();

    initDebug(this);

    Tempus.add(this.onFixedUpdate, {
      fps: 60,
    });
  }

  particleEmitter!: ParticleEmitter;
  initParticleEmitter() {
    this.particleEmitter = new ParticleEmitter({
      renderMode: "billboard",
      particlesCount: 1000,
    });
    this.scene.add(this.particleEmitter);
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

    this.assetsManager.add({
      id: "color-mask-background",
      src: colorMaskBackgroundTextureURL,
      type: "texture",
    });

    await this.assetsManager.loadAll();

    const { models, materials, animationMixer, animations } = parseScene(
      this.assetsManager
    );
    this.models = models;
    this.materials = materials;
    this.animationMixer = animationMixer;
    this.animations = animations;
  }

  initObstacleManager() {
    obstacleManager.init(this.models.obstacle);
    Composite.add(this.matterEngine.world, obstacleManager.physicsWorld);
    this.scene.add(obstacleManager.object3D);
  }

  initTerrain() {
    // Initialy create 3 chunks. Spawn player at the start of 2nd.
    // The very first one is a filler and just here so that there is "something" before player at the start.
    const INITIAL_CHUNKS_COUNT = 3;

    let chunkX = 0;
    let chunkY = 0;

    for (let i = 0; i < INITIAL_CHUNKS_COUNT; i++) {
      const terrainChunk = this.initTerrainChunk(chunkX, chunkY);

      chunkX =
        terrainChunk.curve.points[terrainChunk.curve.points.length - 1].x;

      chunkY =
        terrainChunk.curve.points[terrainChunk.curve.points.length - 1].y;
    }

    // Spawn first pill on the third therrain chunk
    // this.spawnPill(this.terrainChunks[2]);
  }

  spawnPill(terrainChunk = this.terrainChunks[this.terrainChunks.length - 1]) {
    pillManager.spawnPill({
      terrainChunk,
      pillIndex: pillManager.currentPillIndex,
      composite: this.matterEngine.world,
      scene: this.scene,
      progress: 0.5,
    });
  }

  initPlayer() {
    this.player = new Player(
      {
        x: this.terrainChunks[1].curve.points[0].x,
        y: this.terrainChunks[1].curve.points[0].y - DEBUG_PARAMS.player.radius,
      },
      this.models.player,
      this.matterEngine,
      this.animations
    );
    Composite.add(this.matterEngine.world, [this.player.physicsBody]);

    this.scene.add(this.player.object3D);

    this.animationMixer.addEventListener("finished", (e) => {
      if (e.action.getClip().name !== "sliding") {
        this.player.fadeToAction("sliding");
      }
    });
  }

  initBackgroundPlane() {
    this.backgroundPlane = new BackgroundPlane(
      this.models.background as Mesh<BufferGeometry, ShaderMaterial>
    );
    this.scene.add(this.backgroundPlane.object3D);
  }

  initTerrainChunk(x: number, y: number) {
    const terrainChunkIndex = $terrainChunkIndex.get();
    const terrainChunk = new TerrainChunk(x, y, terrainChunkIndex);

    // Only increment chuunk index when game is actually playing.
    // Do not increase difficulty while player is idle during start and end screen.
    if (gameIsPlaying()) {
      $terrainChunkIndex.set(terrainChunkIndex + 1);
    }

    Composite.add(this.matterEngine!.world, terrainChunk.bodies);
    this.scene.add(terrainChunk.object3D);

    this.terrainChunks.push(terrainChunk);

    const landscapes = [
      this.models.landscape1,
      this.models.landscape2,
      this.models.landscape3,
      this.models.landscape4,
    ];

    for (let p = 0; p < 1; p += 0.1) {
      const position = terrainChunk.curve.getPointAt(p);
      const x = position.x;
      const y = -position.y + DEBUG_PARAMS.background.islands.yOffset;
      const z = DEBUG_PARAMS.background.islands.z;

      const random = Math.floor(Math.random() * landscapes.length);
      const mesh = landscapes[random].clone();
      mesh.scale.setScalar(DEBUG_PARAMS.background.islands.scale);
      mesh.position.set(x, y, z);

      const decoration = new BackgroundFloatingDecoration(mesh);

      const prevDecoration = this.decorations[this.decorations.length - 1];

      if (
        !prevDecoration ||
        !decoration.box.intersectsBox(prevDecoration.box)
      ) {
        this.decorations.push(decoration);
        this.scene.add(decoration.object3D);

        frustumCuller.add(decoration.object3D, () => {
          this.scene.remove(decoration.object3D);
        });
      }
    }

    if (gameIsPlaying()) {
      distributeObstaclesOnTerrainChunk(terrainChunk);
    }

    return terrainChunk;
  }

  initTrailFX() {
    this.trailFX = new Trail(
      this.renderer,
      this.assetsManager.get<Texture>("noise_1")
    );

    this.scene.add(this.trailFX.object3D);
  }

  // Iterate over terrain chunks and destroy them once they leave the viewport
  // Leave the viewport === left edge of camera frustum > right edge of chunk BBox
  destroyOutOfViewChunks() {
    const { width: cameraFrustrumWidth } = getCameraFrustrumDimensionsAtDepth(
      cameraManager.perspectiveCamera,
      0
    );
    const halfFrustumWidth = cameraFrustrumWidth / 2;
    const frustumX =
      cameraManager.perspectiveCamera.position.x - halfFrustumWidth;

    for (let i = this.terrainChunks.length - 1; i >= 0; i--) {
      const chunk = this.terrainChunks[i];

      if (chunk.boundingBox && frustumX > chunk.boundingBox.max.x) {
        // Cleanup chunk mesh, physic bodies...
        Composite.remove(this.matterEngine!.world, chunk.bodies);
        this.scene.remove(chunk.object3D);

        this.terrainChunks.splice(i, 1);

        // Create new one
        const lastChunk = this.terrainChunks[this.terrainChunks.length - 1];
        const curveLastPoint =
          lastChunk.curve.points[lastChunk.curve.points.length - 1];

        this.initTerrainChunk(curveLastPoint.x, curveLastPoint.y);
      }
    }
  }

  onCollisionStart(e: IEventCollision<Engine>) {
    emitter.emit("onCollisionStart", e);
  }

  onCollisionEnd(e: IEventCollision<Engine>) {
    emitter.emit("onCollisionEnd", e);
  }

  onResize() {
    cameraManager.perspectiveCamera.aspect =
      window.innerWidth / window.innerHeight;

    cameraManager.perspectiveCamera.updateProjectionMatrix();

    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  onPlayerCollideWithObstacle(id: number) {
    obstacleManager.animateOut(id);
    if (!$allPillsCollected.get()) {
      this.trailFX.fadeOut();
    }
  }

  onPlayerSpeedBackUp() {
    if (!$allPillsCollected.get()) {
      this.trailFX.fadeIn();
    }
  }

  onPlayerCollideWithPill() {
    gsap.to(
      this.materials.colorMaskMaterial.uniforms[
        pillManager.pills[pillManager.currentPillIndex].uniformName
      ],
      {
        value: 1,
      }
    );

    gsap.to(
      this.materials.backgroundPlaneMaterial.uniforms[
        pillManager.pills[pillManager.currentPillIndex].uniformName
      ],
      {
        value: 1,
      }
    );

    const colors = pillManager.pills[pillManager.currentPillIndex].planes.map(
      (p) => p.material.uniforms.uColor.value.clone()
    );
    for (let i = 0; i < DEBUG_PARAMS.particles.pill.count; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];

      this.spawnParticle({
        position: pillManager.pills[pillManager.currentPillIndex].pill.position,
        velocity: {
          x: MathUtils.randFloatSpread(DEBUG_PARAMS.particles.pill.velocity.x),
          y: MathUtils.randFloatSpread(DEBUG_PARAMS.particles.pill.velocity.y),
          z: MathUtils.randFloatSpread(DEBUG_PARAMS.particles.pill.velocity.z),
        },
        acceleration: {
          x: MathUtils.randFloatSpread(
            DEBUG_PARAMS.particles.pill.acceleration.x
          ),
          y: MathUtils.randFloatSpread(
            DEBUG_PARAMS.particles.pill.acceleration.y
          ),
          z: MathUtils.randFloatSpread(
            DEBUG_PARAMS.particles.pill.acceleration.z
          ),
        },
        lifetime: MathUtils.randFloat(
          DEBUG_PARAMS.particles.pill.lifetime.min,
          DEBUG_PARAMS.particles.pill.lifetime.max
        ),
        scaleStart: MathUtils.randFloat(
          DEBUG_PARAMS.particles.pill.scale.min,
          DEBUG_PARAMS.particles.pill.scale.max
        ),
        scaleEnd: 0,
        colorStart: color,
        colorEnd: color,
        rotation: { x: 0, y: 0, z: 0 },
        rotationVelocity: { x: 0, y: 0, z: 0 },
      });
    }

    pillManager.pills[pillManager.currentPillIndex].removeFromWorld(
      this.scene,
      this.matterEngine.world
    );

    pillManager.goToNext();

    this.spawnPill();
  }

  onGameComplete() {
    gsap.to(this.trailFX.floorSimMat.uniforms.uThickness, {
      value: 1,
      duration: 5,
    });

    $gameState.set("completed");

    UI.endScreen.animateIn();
  }

  onFixedUpdate(time: number, deltaTime: number) {
    Engine.update(this.matterEngine, 1000 / 60);

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

    this.particleEmitter.update(time / 1000);

    this.destroyOutOfViewChunks();

    this.player.update(deltaTime);

    pillManager.update(time);

    if (DEBUG_PARAMS.webgl.enabled) {
      this.renderer.render(
        this.scene,
        cameraManager[
          DEBUG_PARAMS.camera.cameraName as "perspectiveCamera" | "debugCamera"
        ]
      );
    }

    if (DEBUG_PARAMS.camera.followPlayer && this.player) {
      cameraManager.update(this.player, this.terrainChunks);
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

    if (this.backgroundPlane) {
      // TODO: Properly handle scaling and positioning of mesh so that it covers the whole viewport without magic numbers.
      // To ease things a bit, mesh should be re-exported with origin at center

      this.backgroundPlane.object3D.position.set(
        cameraManager.perspectiveCamera.position.x,
        cameraManager.perspectiveCamera.position.y,
        DEBUG_PARAMS.background.plane.z
      );

      const { width, height } = getCameraFrustrumDimensionsAtDepth(
        cameraManager.perspectiveCamera,
        DEBUG_PARAMS.background.plane.z
      );

      this.backgroundPlane.object3D.scale.set(
        width / this.backgroundPlane.scaleX,
        height / this.backgroundPlane.scaleY,
        1
      );

      this.materials.colorMaskMaterial.uniforms.uTime.value = time;
      this.materials.colorMaskMaterial.uniforms.uTrailMask.value =
        this.trailFX.bufferSim.output.texture;

      this.materials.backgroundPlaneMaterial.uniforms.uTime.value = time;
      this.materials.backgroundPlaneMaterial.uniforms.uTrailMask.value =
        this.trailFX.bufferSim.output.texture;
    }

    frustumCuller.update(cameraManager.perspectiveCamera);

    this.animationMixer.update(deltaTime / 1000);
  }

  onPillLeaveFrustum() {
    pillManager.pills[pillManager.currentPillIndex].removeFromWorld(
      this.scene,
      this.matterEngine.world
    );

    this.spawnPill();
  }

  spawnParticle({
    position,
    velocity,
    acceleration,
    lifetime,
    scaleStart,
    scaleEnd,
    colorStart,
    colorEnd,
    rotation,
    rotationVelocity,
  }: Particle) {
    this.particleEmitter.spawnParticle({
      position,
      velocity,
      acceleration,
      lifetime,
      scaleStart,
      scaleEnd,
      colorStart,
      colorEnd,
      rotation,
      rotationVelocity,
    });
  }

  startGame() {
    UI.startScreen.animateOut();

    $gameState.set("playing");
    this.spawnPill();
  }

  restartGame() {
    // Reset game state
    $terrainChunkIndex.set(0);
    $allPillsCollected.set(false);
    pillManager.currentPillIndex = 0;
    $gameState.set("playing");

    // Animate out colors and trailFX thickness
    const tweenTarget = { value: 1 };
    const animateOutTrailDuration = 2;
    const animateOutTrailEase = "power3.out";
    gsap.to(tweenTarget, {
      value: 0,
      onUpdate: () => {
        const { value } = tweenTarget;

        const colorMaskMat = this.materials.colorMaskMaterial;
        colorMaskMat.uniforms.uBluesAmount.value = value;
        colorMaskMat.uniforms.uRedsAmount.value = value;
        colorMaskMat.uniforms.uGreensAmount.value = value;
        colorMaskMat.uniforms.uYellowsAmount.value = value;
        colorMaskMat.uniforms.uPurplesAmount.value = value;
        colorMaskMat.uniforms.uWhitesAmount.value = value;

        const backgroundPlaneMat = this.materials.backgroundPlaneMaterial;
        backgroundPlaneMat.uniforms.uBluesAmount.value = value;
        backgroundPlaneMat.uniforms.uRedsAmount.value = value;
        backgroundPlaneMat.uniforms.uGreensAmount.value = value;
        backgroundPlaneMat.uniforms.uYellowsAmount.value = value;
        backgroundPlaneMat.uniforms.uPurplesAmount.value = value;
        backgroundPlaneMat.uniforms.uWhitesAmount.value = value;
      },
      duration: animateOutTrailDuration,
      ease: animateOutTrailEase,
    });
    gsap.to(this.trailFX.floorSimMat.uniforms.uThickness, {
      value: DEBUG_PARAMS.trailFX.thickness,
      duration: animateOutTrailDuration,
      ease: animateOutTrailEase,
    });

    // Re-start spawning pills.
    // Will spwawn first pill on last terrain chunk
    this.spawnPill();

    UI.endScreen.animateOut();
  }
}

export { App };

new App();
