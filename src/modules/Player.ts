import { TERRAIN_CHUNK_PHYSICS_BODY_LABEL } from "./TerrainChunk";
import { Bodies, Body, Engine, Events, IEventCollision, Pair } from "matter-js";
import { SETTINGS } from "../settings";
import { lerp } from "./utils/lerp";
import { getDeltaAngle } from "./utils/getDeltaAngle";
import { degToRad } from "./utils";
import { emitter } from "./emitter";

const TERRAIN_ANGLE_SENSOR_LABEL = "terrain-rotation-sensor";
const PLAYER_BODY_LABEL = "player-body";
const GROUND_SENSOR_LABEL = "player-ground-sensor";

const findPair = (pairs: Pair[], labelA: string, labelB: string) =>
  pairs.find(
    (pair) => pair.bodyA.label === labelA && pair.bodyB.label === labelB
  );

const findPairs = (pairs: Pair[], labelA: string, labelB: string) =>
  pairs.filter(
    (pair) => pair.bodyA.label === labelA && pair.bodyB.label === labelB
  );

class Player {
  private physicsEngine: Engine;

  physicsBody!: Body;
  groundSensor!: Body;
  terrainAngleSensor!: Body;
  desiredRotation = 0;
  isBackflipping = false;
  isGrounded = false;
  isDead = false;
  collidingTerrainChunks: Body[] = [];

  constructor(options: { physicsEngine: Engine }) {
    this.onCollisionStart = this.onCollisionStart.bind(this);
    this.onCollisionEnd = this.onCollisionEnd.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.reset = this.reset.bind(this);

    this.physicsEngine = options.physicsEngine;

    this.initGroundSensor();
    this.initPhysicsBody();
    this.initTerrainAngleSensor();

    document.addEventListener("keydown", this.onKeyDown);
    emitter.on("resetPlayer", this.reset);
  }

  initPhysicsBody() {
    const body = Bodies.rectangle(
      SETTINGS.player.startPosition.x,
      SETTINGS.player.startPosition.y,
      SETTINGS.player.width,
      SETTINGS.player.height,
      {
        chamfer: {
          radius: SETTINGS.player.chamfer,
        },
        friction: SETTINGS.player.friction,
        isStatic: false,
        label: PLAYER_BODY_LABEL,
      }
    );

    this.physicsBody = Body.create({
      parts: [body, this.groundSensor],
    });

    // this.physicsBody = Bodies.circle(
    //   SETTINGS.player.startPosition.x,
    //   SETTINGS.player.startPosition.y,
    //   SETTINGS.player.width / 2
    // );
  }

  /**
   * This sensor checks for the terrain chunk segment right underneath player
   * and copy its angle to the desired player rotation.
   */
  initTerrainAngleSensor() {
    this.terrainAngleSensor = Bodies.rectangle(
      SETTINGS.player.startPosition.x,
      SETTINGS.player.startPosition.y,
      SETTINGS.player.terrainAngleSensor.width,
      SETTINGS.player.terrainAngleSensor.height,
      {
        isSensor: true,
        isStatic: false,
        label: TERRAIN_ANGLE_SENSOR_LABEL,
      }
    );

    Events.on(this.physicsEngine, "collisionStart", this.onCollisionStart);
    Events.on(this.physicsEngine, "collisionEnd", this.onCollisionEnd);
  }

  initGroundSensor() {
    this.groundSensor = Bodies.rectangle(
      SETTINGS.player.startPosition.x,
      SETTINGS.player.startPosition.y,
      SETTINGS.player.width + SETTINGS.player.groundSensorThickness * 2,
      SETTINGS.player.height + SETTINGS.player.groundSensorThickness * 2,
      {
        isSensor: true,
        label: GROUND_SENSOR_LABEL,
      }
    );
  }

  update() {
    // Update ground angle sensor position to match body position
    // Sensor is not part of compound physic body because we want to keep
    // its rotation always facing down.
    Body.setPosition(this.terrainAngleSensor, {
      x: this.physicsBody.position.x,
      y:
        this.physicsBody.position.y +
        SETTINGS.player.terrainAngleSensor.height / 2,
    });

    if (this.isDead) {
      return;
    }

    // Ground sensor can collide with multiple terrain chunks simultaneously.
    // Because of that, it is tricky to rely only on collide start / stop to update isGrounded.
    // Instead, we keep track of every terrain segment colliding with sensor and check if
    // any is currently colliding.
    this.isGrounded = this.collidingTerrainChunks.length > 0;

    // Continuously apply horizontal velocity
    Body.setVelocity(this.physicsBody, {
      x: SETTINGS.player.velocity.x,
      y: this.physicsBody.velocity.y,
    });

    // Prevent physics from rotating physics body
    Body.setAngularVelocity(this.physicsBody, 0);

    if (!this.isBackflipping) {
      const angleDiff = getDeltaAngle(
        this.physicsBody.angle,
        this.desiredRotation
      );

      const angle = lerp(
        this.physicsBody.angle,
        this.physicsBody.angle + angleDiff,
        SETTINGS.player.autoRotateLerpAmount
      );

      Body.setAngle(this.physicsBody, angle);
    }
  }

  onCollisionStart(e: IEventCollision<Engine>) {
    this.onTerrainAngleSensorCollisionStart(e.pairs);
    this.onGroundSensorCollisionStart(e.pairs);
  }

  onCollisionEnd(e: IEventCollision<Engine>) {
    this.onGroundSensorCollisionEnd(e.pairs);
  }

  /**
   * Given collection of colliding elements, check if the terrain angle sensor is
   * colliding with a terrain chun segment. If so copy the angle of terrain chunk segment
   * to player body
   */
  onTerrainAngleSensorCollisionStart(pairs: Pair[]) {
    const collision = findPair(
      pairs,
      TERRAIN_CHUNK_PHYSICS_BODY_LABEL,
      TERRAIN_ANGLE_SENSOR_LABEL
    );

    if (collision) {
      this.desiredRotation = collision.bodyA.angle;
    }
  }

  /**
   * Add terrain segments to list of colliding terrain bodies when it starts colliding
   */
  onGroundSensorCollisionStart(pairs: Pair[]) {
    const chunks = findPairs(
      pairs,
      TERRAIN_CHUNK_PHYSICS_BODY_LABEL,
      GROUND_SENSOR_LABEL
    ).map((pair) => pair.bodyA);

    if (chunks.length) {
      const playerTerrainCollisionStart =
        this.collidingTerrainChunks.length < 1;

      this.collidingTerrainChunks.push(...chunks);
      this.isBackflipping = false;

      if (playerTerrainCollisionStart) {
        this.onPlayerTerrainCollisionStart();
      }
    }
  }

  /**
   * Remove terrain segments from list of colliding terrain bodies when it stops colliding
   */
  onGroundSensorCollisionEnd(pairs: Pair[]) {
    const chunks = findPairs(
      pairs,
      TERRAIN_CHUNK_PHYSICS_BODY_LABEL,
      GROUND_SENSOR_LABEL
    ).map((pair) => pair.bodyA);

    chunks.forEach((chunk) => {
      const index = this.collidingTerrainChunks.findIndex(
        (c) => c.id === chunk.id
      );

      if (index > -1) {
        this.collidingTerrainChunks.splice(index, 1);
      }
    });
  }

  onPlayerTerrainCollisionStart() {
    let chunksAngleSum = 0;
    this.collidingTerrainChunks.forEach((chunk) => {
      chunksAngleSum += chunk.angle;
    });

    const medianChunksAngle =
      chunksAngleSum / this.collidingTerrainChunks.length;

    const angleDiff = getDeltaAngle(this.physicsBody.angle, medianChunksAngle);

    if (Math.abs(angleDiff) >= degToRad(45)) {
      this.isDead = true;
      emitter.emit("fail");
    }
  }

  onKeyDown(e: KeyboardEvent) {
    if (this.isDead) {
      return;
    }

    if (e.code === "Space") {
      if (this.isGrounded) {
        this.doJump();
      } else {
        this.doBackflip();
      }
    }
  }

  doJump() {
    Body.setVelocity(this.physicsBody, {
      x: this.physicsBody.velocity.x,
      y: SETTINGS.player.velocity.jump,
    });
  }

  doBackflip() {
    this.isBackflipping = true;

    Body.setAngle(
      this.physicsBody,
      this.physicsBody.angle - SETTINGS.player.backFlipRotationSpeed
    );
  }

  reset() {
    Events.off(this.physicsEngine, "collisionStart", this.onCollisionStart);
    Events.off(this.physicsEngine, "collisionEnd", this.onCollisionEnd);

    Body.setPosition(this.physicsBody, SETTINGS.player.startPosition);
    Body.setAngle(this.physicsBody, 0);
    Body.setVelocity(this.physicsBody, { x: 0, y: 0 });

    this.isDead = false;
    this.isBackflipping = false;
    this.isGrounded = false;

    Events.on(this.physicsEngine, "collisionStart", this.onCollisionStart);
    Events.on(this.physicsEngine, "collisionEnd", this.onCollisionEnd);
  }
}

export { Player };
