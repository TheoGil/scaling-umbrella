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

const LABEL_OBSTACLE = "obstacle";

const COUNT = 100;

type Obstacle = { object3D: Mesh; physicsBody: Body; id: number };

const dummyVec3 = new Vector3();

const obstacleManager = {
  object3D: new Group(),
  pool: new ObjectPool<Obstacle>(),
  physicsWorld: Composite.create(),

  init(mesh: Mesh<BufferGeometry, MeshBasicMaterial>) {
    for (let index = 0; index < COUNT; index++) {
      const obstacle = {
        id: index,
        object3D: mesh.clone(),
        physicsBody: Bodies.circle(
          0,
          0,
          DEBUG_PARAMS.obstacles.collider.radius,
          {
            isStatic: true,
            isSensor: true,
            label: LABEL_OBSTACLE,
          }
        ),
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

      frustumCuller.add(obstacle.object3D, () => {
        Composite.remove(this.physicsWorld!, obstacle.physicsBody);

        obstacle.object3D.visible = false;

        this.pool.recycle(obstacle);
      });
    }
  },
};

function distributeObstaclesOnTerrainChunk(terrainChunk: TerrainChunk) {
  // No obstacle on first chunk
  if (terrainChunk.index === 0) {
    return;
  }

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
      DEBUG_PARAMS.obstacles.maxPosition
    );

    // Check if another obstacle on this chunk is closer to randomPosition than minDistance
    const tooClose = Boolean(
      positions.find((p) => Math.abs(p - randomPosition) < minObstacleDistance)
    );

    if (!tooClose) {
      terrainChunk.curve.getPointAt(randomPosition, dummyVec3);

      const { x } = dummyVec3;
      const y = -dummyVec3.y;

      // No idea how this works but using the inverted y component of tangeant
      // rotate the obstacle so that is stands nicely on the curve
      terrainChunk.curve.getTangentAt(randomPosition, dummyVec3);
      const rotation = -dummyVec3.y;

      obstacleManager.add(x, y, rotation);

      positions.push(randomPosition);
    }
  }
}

export { obstacleManager, distributeObstaclesOnTerrainChunk, LABEL_OBSTACLE };
