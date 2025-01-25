import {
  BufferGeometry,
  Mesh,
  MeshBasicMaterial,
  Group,
  MathUtils,
  Vector3,
} from "three";
import { DEBUG_PARAMS } from "../settings";
import { Bodies, Body, Composite } from "matter-js";
import { frustumCuller } from "./frustumCulling";
import { TerrainChunk } from "./TerrainChunk";
import { ObjectPool } from "./ObjectPool";
import gsap from "gsap";

const LABEL_OBSTACLE = "obstacle";

const COUNT = 100;

type Obstacle = { object3D: Mesh; physicsBody: Body; id: number };

const dummyVec3 = new Vector3();

const obstacleManager = {
  object3D: new Group(),
  pool: new ObjectPool<Obstacle>(),
  physicsWorld: Composite.create(),
  activeObstacles: [] as Obstacle[],

  init(mesh: Mesh<BufferGeometry, MeshBasicMaterial>) {
    for (let index = 0; index < COUNT; index++) {
      const physicsBody = Bodies.circle(
        0,
        0,
        DEBUG_PARAMS.obstacles.collider.radius,
        {
          isStatic: true,
          isSensor: true,
          label: LABEL_OBSTACLE,
        }
      );

      const obstacle = {
        id: physicsBody.id,
        object3D: mesh.clone(),
        physicsBody,
      };

      obstacle.object3D.scale.set(
        DEBUG_PARAMS.obstacles.size.x,
        DEBUG_PARAMS.obstacles.size.y,
        DEBUG_PARAMS.obstacles.size.z
      );
      obstacle.object3D.visible = false;
      this.object3D.add(obstacle.object3D);

      this.pool.push(obstacle);
    }
  },

  add(x: number, y: number, rotation: number = 0) {
    const obstacle = this.pool.fetch();

    if (obstacle) {
      Composite.add(this.physicsWorld!, obstacle.physicsBody);
      Body.setPosition(obstacle.physicsBody, { x, y: -y });

      obstacle.object3D.position.set(x, y, 0);
      obstacle.object3D.rotation.z = rotation;
      obstacle.object3D.visible = true;

      this.activeObstacles.push(obstacle);

      frustumCuller.add(obstacle.object3D, () => {
        this.remove(obstacle.id);
      });
    }
  },

  remove(id: number) {
    const obstacleIndex = this.activeObstacles.findIndex((o) => o.id === id);
    if (obstacleIndex > -1) {
      const obstacle = this.activeObstacles[obstacleIndex];

      Composite.remove(this.physicsWorld!, obstacle.physicsBody);

      obstacle.object3D.visible = false;

      this.pool.recycle(obstacle);

      this.activeObstacles.splice(obstacleIndex, 1);
    }
  },

  animateOut(id: number) {
    const obstacleIndex = this.activeObstacles.findIndex((o) => o.id === id);
    if (obstacleIndex > -1) {
      const obstacle = this.activeObstacles[obstacleIndex];

      // TEMP ANIMATION
      gsap.to(obstacle.object3D.scale, {
        x: 0,
        y: 0,
        duration: 0.25,
        onComplete: () => {
          this.remove(id);
          obstacle.object3D.scale.set(
            DEBUG_PARAMS.obstacles.size.x,
            DEBUG_PARAMS.obstacles.size.y,
            DEBUG_PARAMS.obstacles.size.z
          );
        },
      });
    }
  },
};

function distributeObstaclesOnTerrainChunk(terrainChunk: TerrainChunk) {
  const lookAheadDistance = 0.125;
  const rotationThreshold = 0.5;

  const clampedChunkIndex = MathUtils.clamp(
    terrainChunk.index,
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
      Math.min(DEBUG_PARAMS.obstacles.maxPosition, 1 - lookAheadDistance)
    );

    // Check if another obstacle on this chunk is closer to randomPosition than minDistance
    const tooClose = Boolean(
      positions.find((p) => Math.abs(p - randomPosition) < minObstacleDistance)
    );

    if (tooClose) {
      continue;
    }

    terrainChunk.curve.getPointAt(randomPosition, dummyVec3);
    const positionX = dummyVec3.x;
    const positionY = -dummyVec3.y;

    // No idea how this works but using the inverted y component of tangeant
    // rotate the obstacle so that is stands nicely on the curve
    terrainChunk.curve.getTangentAt(randomPosition, dummyVec3);
    const rotation = -dummyVec3.y;

    if (randomPosition + lookAheadDistance < 1) {
      terrainChunk.curve.getTangentAt(
        randomPosition + lookAheadDistance,
        dummyVec3
      );

      const lookAheadRotation = -dummyVec3.y;

      const rotationDiff = Math.abs(rotation - lookAheadRotation);

      if (rotationDiff < rotationThreshold) {
        obstacleManager.add(positionX, positionY, rotation);

        positions.push(randomPosition);
      }
    }
  }
}

export { obstacleManager, distributeObstaclesOnTerrainChunk, LABEL_OBSTACLE };
