import "./style.css";

import { createNoise2D } from "simplex-noise";
import { Pane } from "tweakpane";
import { degToRad, randomFloat } from "math-toolbox";
import {
  Engine,
  Render,
  Runner,
  Composite,
  Bodies,
  Body,
  Vector,
} from "matter-js";

import { PARAMS } from "./params";
import { drawCrossHair, divideIntoSegments } from "./utils";

const pane = new Pane();
const SEGMENT_THICKNESS = 50;
const noise2D = createNoise2D();

class TerrainChunk {
  x: number;
  y: number;
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
  segments: { position: Vector; angle: number; length: number }[] = [];
  vertices: Vector[] = [];

  constructor(x: number, y: number) {
    this.x = this.left = x;
    this.y = this.top = y;

    const diagonal = randomFloat(
      PARAMS.chunks.diagonal.min,
      PARAMS.chunks.diagonal.max
    );

    const angle = degToRad(
      randomFloat(PARAMS.chunks.angle.min, PARAMS.chunks.angle.max)
    );

    this.right = this.x + diagonal * Math.cos(angle);
    this.bottom = this.y + diagonal * Math.sin(angle);

    this.width = this.right - this.left;
    this.height = this.bottom - this.top;

    this.initVertices();
    this.initSegments();
  }

  initVertices() {
    const diagonalSegments = divideIntoSegments(
      {
        x: this.x,
        y: this.y,
      },
      {
        x: this.right,
        y: this.bottom,
      },
      PARAMS.chunks.subdivisions
    );

    diagonalSegments.forEach(({ x, y }) => {
      const noise = noise2D(
        x * PARAMS.chunks.noise.frequency,
        y * PARAMS.chunks.noise.frequency
      );

      this.vertices.push({
        x: x,
        y: y + noise * PARAMS.chunks.noise.amplitude,
      });
    });
  }

  initSegments() {
    this.segments = [];
    this.vertices.forEach((vertice, i) => {
      const isLast = i === this.vertices.length - 1;
      const from = isLast ? this.vertices[i - 1] : vertice;
      const to = isLast ? vertice : this.vertices[i + 1];

      const angle = Math.atan2(to.y - from.y, to.x - from.x);
      const length = Math.hypot(from.x - to.x, from.y - to.y);

      this.segments.push({
        position: from,
        angle: angle,
        length: length,
      });
    });
  }

  render(ctx: CanvasRenderingContext2D) {
    ctx.strokeStyle = "rgba(255, 0, 0, 0.25)";
    ctx.setLineDash([5]);

    // Render debug bounding box
    ctx.strokeRect(this.x, this.y, this.width, this.height);

    // Render debug diagonal
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.right, this.bottom);
    ctx.stroke();

    ctx.setLineDash([0]);

    // Render slope
    ctx.beginPath();
    ctx.strokeStyle = "rgba(0, 0, 255, 1)";
    this.vertices.forEach(({ x, y }, i) => {
      if (i === 0) {
        ctx.moveTo(x, y);
        ctx.lineTo(x, y);
      } else {
        ctx.lineTo(x, y);

        if (i === this.vertices.length - 1) {
          ctx.stroke();
        }
      }
    });

    // Debug slop vertices
    this.vertices.forEach(({ x, y }) => {
      drawCrossHair(ctx, x, y, "rgba(0, 0, 255, 1)");
    });

    this.segments.forEach((segment, i) => {
      ctx.save();
      const from = segment.position;

      ctx.fillStyle = `
        rgb(
          ${Math.random() * 255},
          ${Math.random() * 255},
          ${Math.random() * 255}
        )
      `;
      ctx.translate(from.x, from.y);
      ctx.rotate(segment.angle);
      ctx.fillRect(0, 0, segment.length, SEGMENT_THICKNESS);
      ctx.restore();
    });
  }
}

class Game {
  canvasEl: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  chunks: TerrainChunk[] = [];
  bodies: Body[] = [];
  engine: Engine;

  constructor() {
    this.onResize = this.onResize.bind(this);

    this.canvasEl = document.getElementById("canvas") as HTMLCanvasElement;
    this.ctx = this.canvasEl.getContext("2d")!;

    this.canvasEl.width = window.innerWidth;
    this.canvasEl.height = window.innerHeight;

    window.addEventListener("resize", this.onResize);

    this.initTerrainChunks();
    this.initPhysics();
    this.initPhysicsBodies();

    const f = pane
      .addFolder({
        title: "Chunks",
      })
      .on("change", () => {
        this.initTerrainChunks();
        this.initPhysicsBodies();
      });

    const angleFolder = f.addFolder({
      title: "Angle",
    });
    angleFolder.addBinding(PARAMS.chunks.angle, "min", {
      min: 0,
      max: 90,
      step: 1,
    });
    angleFolder.addBinding(PARAMS.chunks.angle, "max", {
      min: 0,
      max: 90,
      step: 1,
    });

    const diagonalFolder = f.addFolder({
      title: "Diagonal",
    });

    diagonalFolder.addBinding(PARAMS.chunks.diagonal, "min", {
      min: 0,
      max: 1000,
      step: 1,
    });
    diagonalFolder.addBinding(PARAMS.chunks.diagonal, "max", {
      min: 0,
      max: 1000,
      step: 1,
    });

    f.addBinding(PARAMS.chunks, "subdivisions", {
      min: 10,
      max: 100,
      step: 1,
    });

    const noiseFolder = f.addFolder({
      title: "Noise",
    });

    noiseFolder.addBinding(PARAMS.chunks.noise, "amplitude", {
      min: 0,
      max: 100,
      step: 1,
    });

    noiseFolder.addBinding(PARAMS.chunks.noise, "frequency", {
      min: 0,
      max: 0.01,
      step: 0.0001,
    });

    f.addButton({
      title: "Redraw",
    }).on("click", () => {
      this.initTerrainChunks();
      this.initPhysicsBodies();
    });
  }

  onResize() {
    this.canvasEl.width = window.innerWidth;
    this.canvasEl.height = window.innerHeight;
  }

  initTerrainChunks() {
    this.chunks = [];

    this.ctx.clearRect(0, 0, innerWidth, innerHeight);

    const CHUNK_COUNT = 5;

    let x = 0;
    let y = 0;

    for (let i = 0; i < CHUNK_COUNT; i++) {
      const chunk = new TerrainChunk(x, y);
      chunk.render(this.ctx);

      this.chunks.push(chunk);

      x = chunk.right;
      y = chunk.bottom;
    }
  }

  initPhysics() {
    this.engine = Engine.create();

    const render = Render.create({
      element: document.body,
      engine: this.engine,
      options: {
        background: "#ff00ff",
        width: window.innerWidth,
        height: window.innerHeight,
        showDebug: true,
      },
    });
    Render.run(render);

    const runner = Runner.create();
    Runner.run(runner, this.engine);
  }

  initPhysicsBodies() {
    Composite.remove(this.engine.world, this.bodies);
    this.bodies = [];

    this.chunks.forEach((chunk) => {
      chunk.segments.forEach((segment) => {
        const body = Bodies.rectangle(
          segment.position.x + segment.length / 2,
          segment.position.y + SEGMENT_THICKNESS / 2,
          segment.length,
          SEGMENT_THICKNESS,
          {
            isStatic: true,
          }
        );

        Body.setCentre(
          body,
          {
            x: -segment.length / 2,
            y: -SEGMENT_THICKNESS / 2,
          },
          true
        );

        Body.setAngle(body, segment.angle);

        Composite.add(this.engine.world, [body]);

        this.bodies.push(body);
      });
    });
  }
}

new Game();
