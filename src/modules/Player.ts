import {
  AnimationAction,
  BufferGeometry,
  Group,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  Vector2,
  Vector2Like,
} from "three";
import { DEBUG_PARAMS } from "../settings";
import { Bodies, Body, Engine, IEventCollision, Pair, Vector } from "matter-js";

import { emitter } from "./emitter";
import { LABEL_TERRAIN_CHUNK } from "./curve";
import gsap from "gsap";
import { LABEL_PILL } from "./Pill";
import { PlayerAnimations } from "./parseScene";
import { LABEL_OBSTACLE } from "./obstacleManager";

const LABEL_TERRAIN_CHUNK_SENSOR = "ground-sensor";
const LABEL_PLAYER = "player";
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
  animations!: PlayerAnimations;
  activeAnimationAction?: AnimationAction;

  isJumping = false;
  jumpButtonDown = false;
  jumpBufferTimer = 0;
  jumpButtonDownTimer = 0;
  isJumpBuffering = false;
  coyoteTimer = 0;

  constructor(
    position: Vector2Like,
    mesh: Mesh<BufferGeometry, MeshBasicMaterial>,
    physicsEngine: Engine,
    animations: PlayerAnimations
  ) {
    this.onJumpButtonPressed = this.onJumpButtonPressed.bind(this);
    this.onJumpButtonReleased = this.onJumpButtonReleased.bind(this);
    this.onCollisionStart = this.onCollisionStart.bind(this);
    this.onCollisionEnd = this.onCollisionEnd.bind(this);

    this.initGroundSensor(position);
    this.initPhysicsBody(position);
    this.initObject3D(position, mesh);

    this.physicsEngine = physicsEngine;
    this.animations = animations;

    emitter.on("onCollisionStart", this.onCollisionStart);
    emitter.on("onCollisionEnd", this.onCollisionEnd);
    emitter.on("onJumpButtonPressed", this.onJumpButtonPressed);
    emitter.on("onJumpButtonReleased", this.onJumpButtonReleased);
  }

  initObject3D(
    position: Vector2Like,
    mesh: Mesh<BufferGeometry, MeshBasicMaterial>
  ) {
    mesh.scale.setScalar(DEBUG_PARAMS.player.radius * 2);
    this.object3D.add(mesh);
    this.object3D.position.set(position.x, -position.y, 0);
  }

  initGroundSensor(position: Vector2Like) {
    this.groundSensor = Bodies.rectangle(
      position.x,
      position.y + DEBUG_PARAMS.player.radius,
      DEBUG_PARAMS.player.groundSensor.width,
      DEBUG_PARAMS.player.groundSensor.height,
      {
        isSensor: true,
        label: LABEL_TERRAIN_CHUNK_SENSOR,
      }
    );
  }

  // Physics body is composed of the actual physics body + the ground sensor
  initPhysicsBody(position: Vector2Like) {
    const body = Bodies.circle(
      position.x,
      position.y,
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
      parts: [body, this.groundSensor],
    });
  }

  update(deltaTime: number) {
    if (this.isGrounded) {
      this.physicsEngine.gravity.y = DEBUG_PARAMS.physics.gravity.grounded;
    } else {
      if (
        this.jumpButtonDown &&
        this.jumpButtonDownTimer < DEBUG_PARAMS.player.variableJump.maxTime
      ) {
        this.jumpButtonDownTimer += deltaTime;
        this.physicsEngine.gravity.y = DEBUG_PARAMS.physics.gravity.jumping;
      } else {
        this.physicsEngine.gravity.y = DEBUG_PARAMS.physics.gravity.falling;
      }
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

    this.object3D.rotation.z = angle;

    Body.setAngularVelocity(this.physicsBody, 0);

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

    if (
      DEBUG_PARAMS.particles.sliding.enabled &&
      this.isGrounded &&
      this.physicsBody.speed > DEBUG_PARAMS.particles.sliding.speed.min
    ) {
      this.burstParticles("sliding");
    }
  }

  jump() {
    this.isJumping = true;

    this.jumpButtonDownTimer = 0;

    this.stopJumpBuffering();

    this.fadeToAction("jumping");

    Body.setVelocity(this.physicsBody, {
      x: this.physicsBody.velocity.x,
      y: DEBUG_PARAMS.player.velocity.jump,
    });
  }

  onJumpButtonPressed() {
    if (!this.jumpButtonDown) {
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

  onJumpButtonReleased() {
    this.jumpButtonDown = false;
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
        this.fadeToAction("falling");

        emitter.emit(
          "onPlayerCollisionWithObstacle",
          pairs[0].bodyA.label === LABEL_OBSTACLE
            ? pairs[0].bodyA.id
            : pairs[0].bodyB.id
        );
      } else {
        this.jump();
      }

      if (DEBUG_PARAMS.particles.obstacle.enabled) {
        this.burstParticles("obstacle");
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

    if (
      this.physicsBody.velocity.y >=
      DEBUG_PARAMS.player.landingAnimationMinVelocity
    ) {
      this.fadeToAction("landing");
    } else {
      this.fadeToAction("sliding");
    }

    if (this.isJumpBuffering && this.jumpBufferTimer < JUMP_BUFFER_TIMER_MAX) {
      this.jump();
    }

    this.stopJumpBuffering();

    if (
      DEBUG_PARAMS.particles.landing.enabled &&
      this.physicsBody.velocity.y >= DEBUG_PARAMS.particles.landing.minVelocityY
    ) {
      this.burstParticles("landing");
    }
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
        emitter.emit("onPlayerSpeedBackUp");

        this.isSlowingDown = false;
        this.fadeToAction("sliding", 0);
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
  }

  fadeToAction(
    animationName: "sliding" | "jumping" | "falling" | "landing",
    duration = 0.1
  ) {
    // Keep reference to previous action
    const previousAnimationAction = this.activeAnimationAction;

    // Get new action
    this.activeAnimationAction = this.animations[animationName];

    // Fade out previous action
    if (
      previousAnimationAction &&
      previousAnimationAction !== this.activeAnimationAction
    ) {
      previousAnimationAction.fadeOut(duration);
    }

    // Fade in new action
    this.activeAnimationAction?.reset().fadeIn(duration).play();
  }

  burstParticles(type: "sliding" | "landing" | "obstacle") {
    const rnd = (min: number, max: number) =>
      MathUtils.randFloat(min, max) *
      MathUtils.mapLinear(
        MathUtils.clamp(
          this.physicsBody.speed,
          DEBUG_PARAMS.particles[type].speed.min,
          DEBUG_PARAMS.particles[type].speed.max
        ),
        DEBUG_PARAMS.particles[type].speed.min,
        DEBUG_PARAMS.particles[type].speed.max,
        0,
        1
      );

    for (let i = 0; i < DEBUG_PARAMS.particles[type].count; i++) {
      const color =
        DEBUG_PARAMS.particles[type].colors[
          Math.floor(Math.random() * DEBUG_PARAMS.particles[type].colors.length)
        ];

      emitter.emit("onSpawnParticle", {
        position: this.object3D.position,
        velocity: {
          x: rnd(
            DEBUG_PARAMS.particles[type].velocity.x.min,
            DEBUG_PARAMS.particles[type].velocity.x.max
          ),
          y: rnd(
            DEBUG_PARAMS.particles[type].velocity.y.min,
            DEBUG_PARAMS.particles[type].velocity.y.max
          ),
          z: rnd(
            DEBUG_PARAMS.particles[type].velocity.z.min,
            DEBUG_PARAMS.particles[type].velocity.z.max
          ),
        },
        acceleration: { x: 0, y: DEBUG_PARAMS.particles[type].gravity, z: 0 },
        lifetime: rnd(
          DEBUG_PARAMS.particles[type].lifetime.min,
          DEBUG_PARAMS.particles[type].lifetime.max
        ),
        scaleStart: rnd(
          DEBUG_PARAMS.particles[type].scale.min,
          DEBUG_PARAMS.particles[type].scale.max
        ),
        scaleEnd: 0,
        colorStart: color,
        colorEnd: color,
        rotation: { x: 0, y: 0, z: 0 },
        rotationVelocity: { x: 0, y: 0, z: 0 },
      });
    }
  }
}

export { Player };
