import { Bounds, Engine, Events, Render } from "matter-js";
import { App } from "./App";
import { drawCrossHair } from "./utils";
import { SETTINGS } from "../settings";

class DebugRenderer {
  render: Render;
  ctx!: CanvasRenderingContext2D;
  app: App;

  constructor(options: {
    physicsEngine: Engine;
    matterCanvasEl: HTMLCanvasElement;
    customDebugCanvasEl: HTMLCanvasElement;
    app: App;
  }) {
    this.onAfterRender = this.onAfterRender.bind(this);

    this.app = options.app;

    options.customDebugCanvasEl.width = innerWidth;
    options.customDebugCanvasEl.height = innerHeight;
    this.ctx = options.customDebugCanvasEl.getContext(
      "2d"
    ) as CanvasRenderingContext2D;

    this.render = Render.create({
      canvas: options.matterCanvasEl,
      engine: options.physicsEngine,
      options: {
        width: innerWidth,
        height: innerHeight,
        wireframeBackground: "#2E5077",
        hasBounds: true,
      },
    });

    Render.run(this.render);

    Events.on(this.render, "afterRender", this.onAfterRender);
  }

  // Callback fired after matter debug rendered has finished rendering
  // Here we can draw additional stuff on top of render.
  onAfterRender() {
    // Render.lookAt(this.render, this.app.player.body, {
    //   x: 500,
    //   y: 500,
    // });
    // Bounds.shift(this.render.bounds, {
    //   x: this.app.player.body.position.x + SETTINGS.player.startPosition.x,
    //   y: this.app.player.body.position.y + SETTINGS.player.startPosition.y,
    // });

    Bounds.shift(this.render.bounds, {
      x:
        this.app.player.physicsBody.position.x -
        SETTINGS.player.startPosition.x -
        SETTINGS.debug.cameraOffset.x,
      y:
        this.app.player.physicsBody.position.y -
        SETTINGS.player.startPosition.y -
        SETTINGS.debug.cameraOffset.y,
    });

    const offsetX =
      -this.app.player.physicsBody.position.x +
      SETTINGS.player.startPosition.x +
      SETTINGS.debug.cameraOffset.x;

    const offsetY =
      -this.app.player.physicsBody.position.y +
      SETTINGS.player.startPosition.y +
      SETTINGS.debug.cameraOffset.y;

    this.ctx.clearRect(0, 0, innerWidth, innerHeight);

    this.app.terrain.chunks.forEach((chunk) => {
      this.ctx.strokeStyle = "#4DA1A9";
      this.ctx.strokeRect(
        chunk.bbox.x + offsetX,
        chunk.bbox.y + offsetY,
        chunk.bbox.width,
        chunk.bbox.height
      );

      this.ctx.beginPath();
      this.ctx.moveTo(chunk.bbox.x + offsetX, chunk.bbox.y + offsetY);
      this.ctx.lineTo(chunk.bbox.right + offsetX, chunk.bbox.bottom + offsetY);
      this.ctx.stroke();

      chunk.vertices.forEach((point) => {
        drawCrossHair(
          this.ctx,
          point.x + offsetX,
          point.y + offsetY,
          "#4DA1A9"
        );
      });

      chunk.offsetVertices.forEach((point) => {
        drawCrossHair(
          this.ctx,
          point.x + offsetX,
          point.y + offsetY,
          "#79D7BE"
        );
      });
    });
  }
}

export { DebugRenderer };
