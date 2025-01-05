import {
  Box3,
  BoxGeometry,
  CatmullRomCurve3,
  Color,
  Group,
  InstancedMesh,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshNormalMaterial,
  Object3D,
  StaticDrawUsage,
  TubeGeometry,
  Vector3,
} from "three";
import { Body } from "matter-js";

import { DEBUG_PARAMS } from "../settings";
import { generateCurve, generatePhysicBodiesFromCurve } from "./curve";
import { Obstacle } from "./Obstacle";

const dummyObject3D = new Object3D();
const dummyVec3 = new Vector3();

class TerrainChunk {
  curve: CatmullRomCurve3;
  object3D: Object3D;
  bodies: Body[] = [];
  instancedRailroadTies!: InstancedMesh;
  tubularSegments: number;
  boundingBox = new Box3();
  obstacles: Obstacle[] = [];
  index: number;

  constructor(startX = 0, startY = innerHeight / 2, index = 0) {
    this.index = index;

    this.object3D = new Group();

    const alternateAngle =
      this.index !== 0 &&
      this.index % DEBUG_PARAMS.segments.alternateAngleEveryNTHChunk === 0;

    this.curve = generateCurve({
      startPosition: {
        x: startX,
        y: startY,
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
      alternateAngle,
    });

    this.tubularSegments = this.computeTubularSegments();

    this.bodies = generatePhysicBodiesFromCurve(
      this.curve,
      this.tubularSegments
    );

    this.initRailProfiles();
    this.initRailTies();
    this.initObstacles();

    //
    // https://github.com/Pomax/bezierjs/blob/master/src/bezier.js#L520
    const t = -50;

    const nv = this.curve.points[0].clone().normalize();

    const coords = this.curve.points.map(function (p) {
      return new Vector3(p.x + t * nv.x, p.y + t * nv.y, 0);
    });

    console.log(coords);

    const c2 = new CatmullRomCurve3(coords);
    const geometry = new TubeGeometry(c2, 1000, 1, 8, false);
    const mat = new MeshNormalMaterial();
    this.object3D.add(new Mesh(geometry, mat));
    //

    // Invert Y axis
    // The curve is "designed" in canvas 2D coordinates system (positive Y is down)
    // but i flip that to render in threejs coordinates system (positive Y is up).
    // It might not be the most straightforward way to think about this "issue"
    // but this is working fine for now.
    this.object3D.scale.y = -1;
  }

  computeTubularSegments() {
    return Math.round(
      this.curve.getLength() / DEBUG_PARAMS.segments.definition
    );
  }

  initRailProfiles() {
    const geometry = new TubeGeometry(
      this.curve,
      this.tubularSegments,
      1,
      8,
      false
    );

    geometry.computeBoundingBox();
    this.boundingBox.copy(geometry.boundingBox!);

    const material = new MeshBasicMaterial({
      color: new Color(DEBUG_PARAMS.terrain.profiles.color),
    });

    /*
    new Color().setRGB(
        Math.random() * 0.5,
        Math.random() * 0.5,
        Math.random() * 0.5
  )
      */

    const count = 2;
    const mesh = new InstancedMesh(geometry, material, count);
    mesh.instanceMatrix.setUsage(StaticDrawUsage);

    for (let i = 0; i < count; i++) {
      dummyObject3D.position.set(
        0,
        0,
        DEBUG_PARAMS.terrain.profiles.depth * i -
          DEBUG_PARAMS.terrain.profiles.depth / 2
      );
      dummyObject3D.updateMatrix();
      mesh.setMatrixAt(i, dummyObject3D.matrix);
    }

    this.object3D.add(mesh);
  }

  initRailTies() {
    const material = new MeshBasicMaterial({
      color: DEBUG_PARAMS.terrain.ties.color,
    });

    const geometry = new BoxGeometry(
      DEBUG_PARAMS.terrain.ties.width,
      DEBUG_PARAMS.terrain.ties.height,
      DEBUG_PARAMS.terrain.ties.depth
    );

    const instancedRailroadTies = new InstancedMesh(
      geometry,
      material,
      this.tubularSegments
    );
    instancedRailroadTies.instanceMatrix.setUsage(StaticDrawUsage);

    this.curve.getSpacedPoints(this.tubularSegments).forEach((point, i) => {
      dummyObject3D.position.set(point.x, point.y + 5, point.z);
      dummyObject3D.updateMatrix();
      instancedRailroadTies.setMatrixAt(i, dummyObject3D.matrix);
    });

    this.object3D.add(instancedRailroadTies);
  }

  destroy() {
    console.log("TODO: Implémenter méthode destroy");
  }

  initObstacles() {
    // No obstacle on first chunk
    if (this.index === 0) {
      return;
    }

    const clampedChunkIndex = MathUtils.clamp(
      this.index,
      DEBUG_PARAMS.obstacles.difficulty.min.chunkIndex,
      DEBUG_PARAMS.obstacles.difficulty.max.chunkIndex
    );

    const obstacleCountMin = MathUtils.mapLinear(
      clampedChunkIndex,
      DEBUG_PARAMS.obstacles.difficulty.min.chunkIndex,
      DEBUG_PARAMS.obstacles.difficulty.max.chunkIndex,
      DEBUG_PARAMS.obstacles.difficulty.min.count.min,
      DEBUG_PARAMS.obstacles.difficulty.max.count.min
    );

    const obstacleCountMax = MathUtils.mapLinear(
      clampedChunkIndex,
      DEBUG_PARAMS.obstacles.difficulty.min.chunkIndex,
      DEBUG_PARAMS.obstacles.difficulty.max.chunkIndex,
      DEBUG_PARAMS.obstacles.difficulty.min.count.max,
      DEBUG_PARAMS.obstacles.difficulty.max.count.max
    );

    const obstaclesCount = Math.round(
      MathUtils.randFloat(obstacleCountMin, obstacleCountMax)
    );

    const minObstacleDistance = MathUtils.mapLinear(
      clampedChunkIndex,
      DEBUG_PARAMS.obstacles.difficulty.min.chunkIndex,
      DEBUG_PARAMS.obstacles.difficulty.max.chunkIndex,
      DEBUG_PARAMS.obstacles.difficulty.min.minDistance,
      DEBUG_PARAMS.obstacles.difficulty.max.minDistance
    );

    // Keep track of the position where obstacles are already place to avoid
    // placing two obstacles too close to each other
    const positions: number[] = [];

    for (let i = 0; i < obstaclesCount; i++) {
      // Pick random position, not too close to chunk start not too close to chunk end
      // to avoid obstale at 0.99 on previous and obstacle at 0.01 on current chunk
      const randomPosition = MathUtils.randFloat(
        DEBUG_PARAMS.obstacles.minPosition,
        DEBUG_PARAMS.obstacles.maxPosition
      );

      // Check if another obstacle on this chunk is closer to randomPosition than minDistance
      const tooClose = Boolean(
        positions.find(
          (p) => Math.abs(p - randomPosition) < minObstacleDistance
        )
      );

      if (!tooClose) {
        this.curve.getPointAt(randomPosition, dummyVec3);

        const obstacle = new Obstacle(dummyVec3.x, dummyVec3.y);

        // No idea how this works but using the inverted y component of tangeant
        // rotate the obstacle so that is stands nicely on the curve
        this.curve.getTangentAt(randomPosition, dummyVec3);
        obstacle.object3D.rotation.z = -dummyVec3.y;

        this.obstacles.push(obstacle);
        positions.push(randomPosition);
      }
    }
  }
}

export { TerrainChunk };
