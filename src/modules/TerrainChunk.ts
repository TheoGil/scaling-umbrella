import { Bodies, Body } from "matter-js";
import { createNoise2D } from "simplex-noise";
import { randomFloat, degToRad, splitIntoSegments } from "./utils";
import { SETTINGS } from "../settings";

const TERRAIN_CHUNK_PHYSICS_BODY_LABEL = "terrain-chunk";

const noise2D = createNoise2D();

class TerrainChunk {
  bbox!: {
    x: number;
    y: number;
    right: number;
    bottom: number;
    width: number;
    height: number;
  };

  bodies: Body[] = [];

  // Both vertices and offsetVertices are not technically needed to be stored on the instance
  // in order for the game to run but it is handy to be able to debug render those.
  vertices: { x: number; y: number }[] = [];
  offsetVertices: { x: number; y: number }[] = [];

  constructor(x: number, y: number) {
    this.initBoundingBox(x, y);
    this.initPhysicsBodies();
  }

  /**
   * Generate the BBox of the chunk by randomizing parameters in given range.
   * The bounding box is computed from it's diagonal. Might seems counter intuitive
   * logic-wise but it is actually easier to think of terrain chunks of a line with an angle instead of a box.
   */
  initBoundingBox(x: number, y: number) {
    const diagonalLength = randomFloat(
      SETTINGS.terrain.chunks.diagonal.length.min,
      SETTINGS.terrain.chunks.diagonal.length.max
    );

    const diagonalAngle = degToRad(
      randomFloat(
        SETTINGS.terrain.chunks.diagonal.angle.min,
        SETTINGS.terrain.chunks.diagonal.angle.max
      )
    );

    const right = x + diagonalLength * Math.cos(diagonalAngle);
    const bottom = y + diagonalLength * Math.sin(diagonalAngle);
    const width = right - x;
    const height = bottom - y;

    this.bbox = {
      x,
      y,
      right,
      bottom,
      width,
      height,
    };
  }

  /**
   * Split the chunk BBox diagonal into multiple segments
   */
  initSegments() {
    const segments: {
      position: { x: number; y: number };
      angle: number;
      length: number;
    }[] = [];

    // Split the bbox diagonal into equidistant points
    this.vertices = splitIntoSegments(
      { x: this.bbox.x, y: this.bbox.y },
      { x: this.bbox.right, y: this.bbox.bottom },
      SETTINGS.terrain.chunks.divisions
    );

    // Offset those point vertically using noise
    this.offsetVertices = this.vertices.map((point) => {
      const noise = noise2D(
        point.x * SETTINGS.terrain.chunks.noise.freq,
        point.y * SETTINGS.terrain.chunks.noise.freq
      );

      return {
        x: point.x,
        y: point.y + noise * SETTINGS.terrain.chunks.noise.amp,
      };
    });

    // Iterate over the vertices to compute a definition of every segments as
    // a position, a length and an angle
    this.offsetVertices.forEach((vertice, i) => {
      const isLast = i === this.offsetVertices.length - 1;
      const from = isLast ? this.offsetVertices[i - 1] : vertice;
      const to = isLast ? vertice : this.offsetVertices[i + 1];

      const angle = Math.atan2(to.y - from.y, to.x - from.x);
      const length = Math.hypot(from.x - to.x, from.y - to.y);

      segments.push({
        position: from,
        angle,
        length,
      });
    });

    return segments;
  }

  initPhysicsBodies() {
    const segments = this.initSegments();

    segments.forEach((segment) => {
      const body = Bodies.rectangle(
        segment.position.x + segment.length / 2,
        segment.position.y + SETTINGS.terrain.chunks.thickness / 2,
        segment.length,
        SETTINGS.terrain.chunks.thickness,
        {
          isStatic: true,
          label: TERRAIN_CHUNK_PHYSICS_BODY_LABEL,
        }
      );

      Body.setCentre(
        body,
        {
          x: -segment.length / 2,
          y: -SETTINGS.terrain.chunks.thickness / 2,
        },
        true
      );

      Body.setAngle(body, segment.angle);

      this.bodies.push(body);
    });

    // this.scene.matter.world.add(this.bodies);
  }
}

export { TerrainChunk, TERRAIN_CHUNK_PHYSICS_BODY_LABEL };
