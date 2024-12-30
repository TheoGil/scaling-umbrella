import { Pane, FolderApi } from "tweakpane";
import * as EssentialsPlugin from "@tweakpane/plugin-essentials";
import { Composite, Engine, Events, Render, Runner } from "matter-js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import "./style.css";
import { drawCrossHair } from "./utils/drawCrosshair";
import { generateCurve, generatePhysicBodiesFromCurve } from "./modules/curve";
import {
  CatmullRomCurve3,
  Mesh,
  MeshNormalMaterial,
  PerspectiveCamera,
  Scene,
  TubeGeometry,
  WebGLRenderer,
} from "three";
import { DEBUG_PARAMS } from "./settings";
import { Player } from "./modules/Player";

////////////////
////////////////

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
  curve!: CatmullRomCurve3;
  matterEngine!: Engine;
  matterRenderer!: Render;
  runner!: Runner;
  scene!: Scene;
  camera!: PerspectiveCamera;
  renderer!: WebGLRenderer;
  player!: Player;

  constructor() {
    this.onDebugBeforeRender = this.onDebugBeforeRender.bind(this);
    this.onDebugAfterRender = this.onDebugAfterRender.bind(this);
    this.onAfterTick = this.onAfterTick.bind(this);
    this.onPhysicsEngineBeforeUpdate =
      this.onPhysicsEngineBeforeUpdate.bind(this);
    this.onPhysicsEngineAfterUpdate =
      this.onPhysicsEngineAfterUpdate.bind(this);

    this.initRendering();
    this.initPhysics();
    this.init();

    console.log(this);
  }

  initPhysics() {
    this.matterEngine = Engine.create();

    Events.on(
      this.matterEngine,
      "afterUpdate",
      this.onPhysicsEngineAfterUpdate
    );

    this.matterRenderer = Render.create({
      canvas: document.getElementById("matter-canvas") as HTMLCanvasElement,
      engine: this.matterEngine,
      options: {
        width: innerWidth,
        height: innerHeight,
        wireframeBackground: "transparent",
      },
    });
    Render.run(this.matterRenderer);
    Events.on(this.matterRenderer, "beforeRender", this.onDebugBeforeRender);
    Events.on(this.matterRenderer, "afterRender", this.onDebugAfterRender);

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
    this.curve = generateCurve({
      startPosition: {
        x: 0,
        y: innerHeight / 2,
        z: 0,
      },
      segmentsCount: DEBUG_PARAMS.segments.count,
      segmentsAngle: {
        min: DEBUG_PARAMS.segments.angle.min,
        max: DEBUG_PARAMS.segments.angle.max,
      },
      segmentsLength: {
        min: DEBUG_PARAMS.segments.length.min,
        max: DEBUG_PARAMS.segments.length.max,
      },
      alternateAngle: DEBUG_PARAMS.segments.alternateAngle,
    });

    const bodies = generatePhysicBodiesFromCurve(this.curve);

    Composite.add(this.matterEngine!.world, bodies);

    const curveGeometry = new TubeGeometry(
      this.curve,
      DEBUG_PARAMS.segments.definition,
      1,
      8,
      false
    );
    const curveMaterial = new MeshNormalMaterial();
    const curveMesh = new Mesh(curveGeometry, curveMaterial);
    this.scene.add(curveMesh);

    // The Y axis is inverted in canvas 2D / threejs space
    curveMesh.scale.y = -1;

    this.player = new Player();
    Composite.add(this.matterEngine.world, this.player.physicsBody);
    this.scene.add(this.player.mesh);
  }

  focusCameraOnPlayer() {
    this.camera?.position.set(
      this.player.mesh.position.x,
      this.player.mesh.position.y,
      300
    );

    this.camera.lookAt(this.player.mesh.position);
  }

  onDebugBeforeRender() {
    // Center and pad camera to target on curve
    const target = this.curve.getPointAt(DEBUG_PARAMS.p);

    Render.lookAt(
      this.matterRenderer,
      {
        position: {
          x: target.x,
          y: target.y,
        },
      },
      {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      }
    );

    /*
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
    */
  }

  // Additional custom debug 2D rendering on top of matterJS debug render
  onDebugAfterRender({
    source,
  }: {
    source: { context: CanvasRenderingContext2D };
  }) {
    source.context.save();

    const target = this.curve.getPointAt(DEBUG_PARAMS.p);
    const cameraOffsetX = target.x - window.innerWidth / 2;
    const cameraOffsetY = target.y - window.innerHeight / 2;
    source.context.translate(-cameraOffsetX, -cameraOffsetY);

    source.context.lineWidth = 1;
    drawCrossHair(source.context, target.x, target.y, "green");

    source.context.restore();
  }

  // Fired once at the end of the browser frame, after beforeTick, tick and after any engine updates.
  onAfterTick() {
    // this.player.update();
    // this.focusCameraOnPlayer();
    this.renderer.render(this.scene!, this.camera!);
  }

  onPhysicsEngineBeforeUpdate() {}

  onPhysicsEngineAfterUpdate() {
    // The Y axis is inverted in canvas 2D / threejs space
    this.player.mesh.position.set(
      this.player.physicsBody.position.x,
      -this.player.physicsBody.position.y,
      0
    );

    // Prevent unwanted body rotation
    // Body.setAngularVelocity(this.player.physicsBody, 0);
  }
}

new App();
