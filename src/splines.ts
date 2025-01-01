import "./style.css";
import { generateCurve } from "./modules/curve";
import { CatmullRomCurve3, MathUtils } from "three";

/*
const debug = new Pane() as FolderApi;
debug.registerPlugin(EssentialsPlugin);

debug.addBinding(DEBUG_PARAMS, "p", {
  min: 0,
  max: 1,
  step: 0.001,
  label: "Progress",
});

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

const canvasEl = document.getElementById("debug-canvas") as HTMLCanvasElement;
canvasEl.width = innerWidth;
canvasEl.height = innerHeight;
const ctx = canvasEl.getContext("2d") as CanvasRenderingContext2D;

function renderCurve(curve: CatmullRomCurve3, color: string) {
  // curve.points.forEach((p) => {
  //   drawCrossHair(ctx, p.x, p.y, color, 10);
  // });

  ctx.strokeStyle = color;
  ctx.beginPath();
  curve.getSpacedPoints(100).forEach((p, i) => {
    if (i === 0) {
      ctx.moveTo(p.x, p.y);
    } else {
      ctx.lineTo(p.x, p.y);
    }
  });
  ctx.stroke();
}

const c1 = generateCurve({
  startPosition: {
    x: 0,
    y: innerHeight / 2,
    z: 0,
  },
  segmentsCount: 5,
  segmentsAngle: { min: 0, max: MathUtils.degToRad(45) },
  segmentsLength: { min: 100, max: 100 },
  alternateAngle: false,
});

const c2 = generateCurve({
  startPosition: {
    x: c1.points[c1.points.length - 1].x,
    y: c1.points[c1.points.length - 1].y,
    z: 0,
  },

  segmentsCount: 5,
  segmentsAngle: { min: 0, max: MathUtils.degToRad(10) },
  segmentsLength: { min: 100, max: 100 },
  alternateAngle: true,
});

const c3 = generateCurve({
  startPosition: {
    x: c2.points[c2.points.length - 1].x,
    y: c2.points[c2.points.length - 1].y,
    z: 0,
  },

  segmentsCount: 5,
  segmentsAngle: { min: MathUtils.degToRad(10), max: MathUtils.degToRad(30) },
  segmentsLength: { min: 100, max: 100 },
  alternateAngle: true,
});

const c4 = generateCurve({
  startPosition: {
    x: c3.points[c3.points.length - 1].x,
    y: c3.points[c3.points.length - 1].y,
    z: 0,
  },

  segmentsCount: 5,
  segmentsAngle: { min: 0, max: MathUtils.degToRad(-30) },
  segmentsLength: { min: 100, max: 100 },
  alternateAngle: false,
});

renderCurve(c1, "red");
renderCurve(c2, "green");
renderCurve(c3, "blue");
renderCurve(c4, "orange");
