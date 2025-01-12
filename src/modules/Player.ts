import {
  BufferGeometry,
  Group,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  Vector2,
} from "three";
import { DEBUG_PARAMS } from "../settings";
import { Bodies, Body, Engine, IEventCollision, Pair, Vector } from "matter-js";

import { emitter } from "./emitter";
import { LABEL_TERRAIN_CHUNK } from "./curve";
import gsap from "gsap";
import { LABEL_OBSTACLE } from "./Obstacle";
import { LABEL_PILL } from "./Pill";

const LABEL_TERRAIN_CHUNK_SENSOR = "ground-sensor";
const LABEL_PLAYER = "player";
const START_POS_X = 10;
const START_POS_Y = 300;
const JUMP_BUFFER_TIMER_MAX = 5;
const COYOTE_TIMER_MAX = 10;
const MAGIC_SCALE_NUMBER_FIXME = 25;

const findPairs = (pairs: Pair[], labelA: string, labelB: string) =>
  pairs.filter(
    (pair) =>
      (pair.bodyA.label === labelA && pair.bodyB.label === labelB) ||
      (pair.bodyA.label === labelB && pair.bodyB.label === labelA)
  );

const getCollidingTerrainChunks = (pairs: Pair[], sensorLabel: string) =>
  findPairs(pairs, LABEL_TERRAIN_CHUNK, sensorLabel).map((pair) =>
    pair.bodyA.label === LABEL_TERRAIN_CHUNK ? pair.bodyA : pair.bodyB
  );

class Player {
  isGrounded = false;
  object3D = new Group();
  rotationContainer = new Group();
  physicsBody!: Body;
  groundSensor!: Body;
  collidingTerrainChunks: Body[] = [];
  desiredRotation = 0;
  object3DTween?: gsap.core.Tween;
  velocityX = DEBUG_PARAMS.player.velocity.x;
  isSlowingDown = false;
  slowDownDelayedCall?: gsap.core.Tween;
  rampUpVelocityTween?: gsap.core.Tween;
  movement = new Vector2();

  physicsEngine: Engine;

  isJumping = false;
  jumpButtonDown = false;
  jumpBufferTimer = 0;
  jumpButtonDownTimer = 0;
  isJumpBuffering = false;
  coyoteTimer = 0;

  constructor(
    mesh: Mesh<BufferGeometry, MeshBasicMaterial>,
    physicsEngine: Engine
  ) {
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.onCollisionStart = this.onCollisionStart.bind(this);
    this.onCollisionEnd = this.onCollisionEnd.bind(this);

    this.initGroundSensor();
    this.initPhysicsBody();
    this.initObject3D(mesh);

    this.physicsEngine = physicsEngine;

    emitter.on("onCollisionStart", this.onCollisionStart);
    emitter.on("onCollisionEnd", this.onCollisionEnd);
    document.addEventListener("keydown", this.onKeyDown);
    document.addEventListener("keyup", this.onKeyUp);
  }

  initObject3D(mesh: Mesh<BufferGeometry, MeshBasicMaterial>) {
    mesh.scale.setScalar(DEBUG_PARAMS.player.radius * 2);
    this.rotationContainer.add(mesh);
    this.object3D.add(this.rotationContainer);
  }

  initGroundSensor() {
    this.groundSensor = Bodies.rectangle(
      START_POS_X,
      START_POS_Y + DEBUG_PARAMS.player.radius,
      DEBUG_PARAMS.player.groundSensor.width,
      DEBUG_PARAMS.player.groundSensor.height,
      {
        isSensor: true,
        label: LABEL_TERRAIN_CHUNK_SENSOR,
      }
    );
  }

  // Physics body is composed of the actual physics body + the ground sensor
  initPhysicsBody() {
    const body = Bodies.circle(
      START_POS_X,
      START_POS_Y,
      DEBUG_PARAMS.player.radius,
      {
        friction: DEBUG_PARAMS.player.friction,
        frictionStatic: DEBUG_PARAMS.player.frictionStatic,
        restitution: DEBUG_PARAMS.player.restitution,
        label: LABEL_PLAYER,
      },
      25
    );

    this.physicsBody = Body.create({
      // parts: [body],
      parts: [body, this.groundSensor],
    });
  }

  update(deltaTime: number) {
    if (
      this.jumpButtonDown &&
      this.jumpButtonDownTimer < DEBUG_PARAMS.player.variableJump.maxTime
    ) {
      this.jumpButtonDownTimer += deltaTime;
      this.physicsEngine.gravity.y = DEBUG_PARAMS.physics.gravity.jumping;
    } else {
      this.physicsEngine.gravity.y = DEBUG_PARAMS.physics.gravity.falling;
    }

    if (this.isJumpBuffering) {
      this.jumpBufferTimer += 1;
    }

    const wasGrounded = this.isGrounded;

    // Ground sensor can collide with multiple terrain chunks simultaneously.
    // Because of that, it is tricky to rely only on collide start / stop to update isGrounded.
    // Instead, we keep track of every terrain segment colliding with sensor and check if
    // any is currently colliding.
    this.isGrounded = this.collidingTerrainChunks.length > 0;

    if (wasGrounded && !this.isGrounded) {
      this.onUnground();
    }

    if (!this.isGrounded) {
      this.coyoteTimer += 1;
    }

    // Autorotate based on terrain chunk angle sensor
    const angle = MathUtils.lerp(
      this.object3D.rotation.z,
      -this.desiredRotation + MathUtils.degToRad(90),
      DEBUG_PARAMS.player.autoRotateLerpAmount
    );

    // console.log(MathUtils.radToDeg(this.desiredRotation));
    this.object3D.rotation.z = angle;

    Body.setAngularVelocity(this.physicsBody, 0);
    Body.setAngle(this.physicsBody, 0);

    // Body.setAngle(this.physicsBody, angle);

    // Prevent rotation, always stands up

    // this.object3D.rotation.z = -this.physicsBody.angle;

    if (this.isGrounded) {
      this.physicsEngine.gravity.y = DEBUG_PARAMS.physics.gravity.grounded;
    }

    // Continuously apply horizontal velocity unless player has hit an obstacle
    if (!this.isSlowingDown) {
      Body.setVelocity(this.physicsBody, {
        x: this.velocityX,
        y: this.physicsBody.velocity.y,
      });
    }

    const newX = this.physicsBody.position.x;
    // The Y axis is inverted in canvas 2D / threejs space
    const newY = -this.physicsBody.position.y - MAGIC_SCALE_NUMBER_FIXME;

    this.movement.y = newY - this.object3D.position.y;

    this.object3D.position.set(newX, newY, 0);
  }

  jump() {
    this.isJumping = true;

    this.jumpButtonDownTimer = 0;

    this.stopJumpBuffering();

    this.object3DTween?.kill();
    this.object3DTween = gsap.fromTo(
      this.object3D.scale,
      {
        y: 1.5,
        x: 0.5,
      },
      {
        y: 1,
        x: 1,
        ease: "elastic.out(1,0.3)",
        duration: 1,
      }
    );

    Body.setVelocity(this.physicsBody, {
      x: this.physicsBody.velocity.x,
      y: DEBUG_PARAMS.player.velocity.jump,
    });
  }

  onKeyDown(e: KeyboardEvent) {
    if (e.code === "Space" && !this.jumpButtonDown) {
      this.jumpButtonDown = true;

      if (
        (this.isGrounded ||
          (!this.isJumping && this.coyoteTimer < COYOTE_TIMER_MAX)) &&
        !this.isSlowingDown
      ) {
        this.jump();
      } else {
        this.startJumpBuffering();
      }
    }
  }

  onKeyUp(e: KeyboardEvent) {
    if (e.code === "Space") {
      this.jumpButtonDown = false;
    }
  }

  onCollisionStart(e: IEventCollision<Engine>) {
    this.onGroundPlayerCollision(e.pairs);
    this.onGroundSensorCollisionStart(e.pairs);
    this.onObstacleCollisionStart(e.pairs);
    this.onPillCollisionStart(e.pairs);
  }

  onCollisionEnd(e: IEventCollision<Engine>) {
    this.onGroundSensorCollisionEnd(e.pairs);
  }

  onGroundPlayerCollision(pairs: Pair[]) {
    const pair = pairs.find(
      (p) =>
        (p.bodyA.label === LABEL_PLAYER &&
          p.bodyB.label === LABEL_TERRAIN_CHUNK) ||
        (p.bodyB.label === LABEL_PLAYER &&
          p.bodyA.label === LABEL_TERRAIN_CHUNK)
    );

    if (pair) {
      const normal =
        pair.collision.normal.y >= 0
          ? pair.collision.normal
          : Vector.neg(pair.collision.normal);

      this.desiredRotation = Math.atan2(normal.y, normal.x);
    }
  }

  onObstacleCollisionStart(p: Pair[]) {
    const pairs = findPairs(p, LABEL_PLAYER, LABEL_OBSTACLE);
    if (pairs.length) {
      if (this.isGrounded) {
        this.slowDown();

        emitter.emit("onPlayerCollisionWithObstacle");
      } else {
        this.jump();
      }
    }
  }

  onPillCollisionStart(p: Pair[]) {
    const pairs = findPairs(p, LABEL_PLAYER, LABEL_PILL);
    if (pairs.length) {
      emitter.emit("onPlayerCollisionWithPill");
    }
  }

  /**
   * Add all colliding terrain chunks to array.
   * Note that there might be no terrain chunks at all.
   */
  onGroundSensorCollisionStart(pairs: Pair[]) {
    const terrainChunks = getCollidingTerrainChunks(
      pairs,
      LABEL_TERRAIN_CHUNK_SENSOR
    );

    if (this.collidingTerrainChunks.length === 0 && terrainChunks.length) {
      this.onGroundBack();
    }

    terrainChunks.length && this.collidingTerrainChunks.push(...terrainChunks);
  }

  /**
   * On collision end, remove terrain chunk that has stopped colliding with sensor
   * from array
   */
  onGroundSensorCollisionEnd(pairs: Pair[]) {
    const terrainChunks = getCollidingTerrainChunks(
      pairs,
      LABEL_TERRAIN_CHUNK_SENSOR
    );

    terrainChunks.forEach((chunk) => {
      const index = this.collidingTerrainChunks.findIndex(
        (c) => c.id === chunk.id
      );

      if (index > -1) {
        this.collidingTerrainChunks.splice(index, 1);
      }
    });
  }

  onGroundBack() {
    this.coyoteTimer = 0;
    this.isJumping = false;

    this.object3DTween?.kill();
    this.object3DTween = gsap.fromTo(
      this.object3D.scale,
      {
        y: 0.75,
        x: 1.5,
      },
      {
        y: 1,
        x: 1,
        ease: "elastic.out(1,0.3)",
      }
    );

    if (this.isJumpBuffering && this.jumpBufferTimer < JUMP_BUFFER_TIMER_MAX) {
      this.jump();
    }

    this.stopJumpBuffering();
  }

  onUnground() {
    this.coyoteTimer = 0;
  }

  startJumpBuffering() {
    this.isJumpBuffering = true;
    this.jumpBufferTimer = 0;
  }

  stopJumpBuffering() {
    this.isJumpBuffering = false;
    this.jumpBufferTimer = 0;
  }

  reset() {
    Body.setAngle(this.physicsBody, 0);
    Body.setVelocity(this.physicsBody, { x: 0, y: 0 });
    Body.setAngularSpeed(this.physicsBody, 0);
    Body.setAngularVelocity(this.physicsBody, 0);
  }

  slowDown() {
    this.isSlowingDown = true;

    this.slowDownDelayedCall?.kill();
    this.slowDownDelayedCall = gsap.delayedCall(
      DEBUG_PARAMS.player.slowdown.duration,
      () => {
        this.isSlowingDown = false;

        this.rotationContainer.rotation.z = MathUtils.degToRad(0);

        this.rampUpVelocityTween?.kill();
        this.rampUpVelocityTween = gsap.fromTo(
          this,
          {
            velocityX: this.physicsBody.velocity.x,
          },
          {
            velocityX: DEBUG_PARAMS.player.velocity.x,
            duration: DEBUG_PARAMS.player.slowdown.timeToMaxVel,
            ease: "power2.in",
          }
        );
      }
    );

    this.rotationContainer.rotation.z = MathUtils.degToRad(-90);
  }
}

export { Player };
