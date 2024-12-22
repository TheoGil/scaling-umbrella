import gsap from "gsap";
import { initDebug } from "./debug";
import { DebugRenderer } from "./DebugRenderer";
import { emitter } from "./emitter";
import { Player } from "./Player";
import { Terrain } from "./Terrain";

import { Composite, Engine, Events, Runner } from "matter-js";

class App {
  physicsEngine!: Engine;
  runner!: Runner;

  debugRenderer?: DebugRenderer;

  terrain!: Terrain;
  player!: Player;

  constructor() {
    this.onFail = this.onFail.bind(this);
    this.onRestart = this.onRestart.bind(this);

    this.initPhysics();
    this.initDebugRenderer();
    this.initTerrain();
    this.initPlayer();

    initDebug(this);

    emitter.on("fail", this.onFail);

    document
      .querySelector("#fail button")
      ?.addEventListener("click", this.onRestart);
  }

  initPhysics() {
    this.onPhysicsAfterUpdate = this.onPhysicsAfterUpdate.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);

    this.physicsEngine = Engine.create({
      //   gravity: {
      //     y: 0,
      //   },
    });

    this.runner = Runner.create();

    Runner.run(this.runner, this.physicsEngine);

    Events.on(this.physicsEngine, "afterUpdate", this.onPhysicsAfterUpdate);
    document.addEventListener("mousemove", this.onMouseMove);
  }

  initDebugRenderer() {
    this.debugRenderer = new DebugRenderer({
      matterCanvasEl: document.querySelector(
        "canvas#matter-canvas"
      ) as HTMLCanvasElement,
      customDebugCanvasEl: document.querySelector(
        "canvas#debug-canvas"
      ) as HTMLCanvasElement,
      physicsEngine: this.physicsEngine,
      app: this,
    });
  }

  initTerrain() {
    this.terrain = new Terrain({
      physicsEngine: this.physicsEngine,
    });
  }

  initPlayer() {
    this.player = new Player({
      physicsEngine: this.physicsEngine,
    });
    Composite.add(this.physicsEngine.world, [
      this.player.physicsBody,
      this.player.terrainAngleSensor,
    ]);
  }

  onPhysicsAfterUpdate() {
    this.player.update();

    const scoreEl = document.querySelector("#gui-distance") as HTMLElement;
    if (scoreEl) {
      scoreEl.innerText = (this.player.physicsBody.position.x / 100).toFixed(0);
    }
  }

  onMouseMove(_e: MouseEvent) {
    // Body.setPosition(this.player.body, {
    //   x: e.clientX,
    //   y: e.clientY,
    // });
  }

  onFail() {
    (document.querySelector("#fail") as HTMLElement).style.display = "flex";

    gsap.to(this.physicsEngine.timing, {
      timeScale: 0,
      ease: "power4.out",
      duration: 2,
    });
  }

  onRestart() {
    (document.querySelector("#fail") as HTMLElement).style.display = "none";
    emitter.emit("resetPlayer");

    gsap.killTweensOf(this.physicsEngine.timing);
    this.physicsEngine.timing.timeScale = 1;
  }
}

export { App };
