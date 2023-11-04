import { degToRad, randomFloat } from "math-toolbox";
import { Vector } from "matter-js";
import { createNoise2D } from "simplex-noise";
import { Types } from "phaser";

import { PARAMS } from "../params";
import { divideIntoSegments } from "../utils";
import { PrototypeScene } from "../main";

const TERRAIN_CHUNK_PHYSICS_BODY_LABEL = "terrain-chunk";

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
  scene: PrototypeScene;
  bodies: Types.Physics.Matter.MatterBody[] = [];

  constructor(x: number, y: number, scene: PrototypeScene) {
    this.x = this.left = x;
    this.y = this.top = y;
    this.scene = scene;

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
    this.initPhysics();

    this.scene.graphics.lineStyle(1, 0x00ff00, 0.1);
    this.scene.graphics.strokeRect(
      this.left,
      this.top,
      this.width,
      this.height
    );
    this.scene.graphics.lineBetween(
      this.left,
      this.top,
      this.right,
      this.bottom
    );
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

  initPhysics() {
    this.segments.forEach((segment) => {
      const body = this.scene.matter.bodies.rectangle(
        segment.position.x + segment.length / 2,
        segment.position.y + PARAMS.chunks.thickness / 2,
        segment.length,
        PARAMS.chunks.thickness,
        {
          isStatic: true,
          label: TERRAIN_CHUNK_PHYSICS_BODY_LABEL,
        }
      );

      this.scene.matter.body.setCentre(
        body,
        {
          x: -segment.length / 2,
          y: -PARAMS.chunks.thickness / 2,
        },
        true
      );

      this.scene.matter.body.setAngle(body, segment.angle, false);

      this.bodies.push(body);
    });

    this.scene.matter.world.add(this.bodies);
  }

  destroy() {
    this.scene.matter.world.remove(this.bodies);
  }
}

export { TerrainChunk, TERRAIN_CHUNK_PHYSICS_BODY_LABEL };
