import { App } from "./modules/App";
import { randomFloat } from "./modules/utils";
import "./style.css";
import { Bezier } from "bezier-js";

// new App();

const MIN_WIDTH = 200;
const MAX_WIDTH = 400;
const MIN_HEIGHT = 100;
const MAX_HEIGHT = 200;

type Type = "concave" | "convex";

class Chunk {
  x: number;
  y: number;
  width: number;
  height: number;
  type: Type;

  constructor(x: number, y: number, type: Type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.width = randomFloat(MIN_WIDTH, MAX_WIDTH);
    this.height = randomFloat(MIN_HEIGHT, MAX_HEIGHT);
  }

  render(ctx: CanvasRenderingContext2D) {
    // ctx.strokeStyle = "#72BAA9";

    // ctx.beginPath();
    // ctx.moveTo(this.x, this.y);
    // ctx.lineTo(this.x + this.width, this.y + this.height);
    // ctx.stroke();

    const ctrlX =
      this.type === "concave"
        ? randomFloat(this.x, this.x + this.width / 2)
        : randomFloat(this.x + this.width / 2, this.x + this.width);

    const ctrlY =
      this.type === "concave"
        ? randomFloat(this.y + this.height / 2, this.y + this.height)
        : randomFloat(this.y, this.y + this.height / 2);

    new Bezier([
      {
        x: this.x,
        y: this.y,
      },
      {
        x: ctrlX,
        y: ctrlY,
      },
      {
        x: this.x + this.width,
        y: this.y + this.height,
      },
    ]);

    ctx.lineWidth = 1;
    ctx.strokeStyle = "#D5E7B5";
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(ctrlX, ctrlY);
    ctx.lineTo(this.x + this.width, this.y + this.height);
    ctx.stroke();
    ctx.strokeRect(this.x, this.y, this.width, this.height);

    ctx.lineWidth = 5;
    ctx.strokeStyle = "#D5E7B5";
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.quadraticCurveTo(
      ctrlX,
      ctrlY,
      this.x + this.width,
      this.y + this.height
    );
    ctx.stroke();
  }
}

const canvasEl = document.querySelector("#debug-canvas") as HTMLCanvasElement;

canvasEl.width = window.innerWidth;
canvasEl.height = window.innerHeight;

const ctx = canvasEl.getContext("2d") as CanvasRenderingContext2D;

ctx.fillStyle = "#474E93";
ctx.fillRect(0, 0, canvasEl.width, canvasEl.height);

const chunks = [];
let x = 0;
let y = 0;
let type: Type = "concave";
for (let i = 0; i < 50; i++) {
  const chunk = new Chunk(x, y, type);
  chunks.push(chunk);

  x += chunk.width;
  y += chunk.height;
  type = type === "concave" ? "convex" : "concave";
}

chunks.forEach((c) => {
  c.render(ctx);
});
