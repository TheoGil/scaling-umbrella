import {
  BufferGeometry,
  Group,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  Object3D,
} from "three";
import { DEBUG_PARAMS } from "../settings";
import { Bodies, Body, Engine, IEventCollision, Pair } from "matter-js";

import { GLTFLoader } from "three/examples/jsm/Addons.js";
import playerGlbUrl from "/player.glb?url";
import { emitter } from "./emitter";
import { LABEL_TERRAIN_CHUNK } from "./curve";

const LABEL_TERRAIN_CHUNK_SENSOR = "ground-sensor";
const LABEL_TERRAIN_ANGLE_SENSOR = "terrain-angle-sensor";
const START_POS_X = 10;
const START_POS_Y = 300;

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
  object3D: Object3D;
  physicsBody!: Body;
  groundSensor!: Body;
  terrainAngleSensor!: Body;
  collidingTerrainChunks: Body[] = [];
  desiredRotation = 0;

  constructor() {
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onCollisionStart = this.onCollisionStart.bind(this);
    this.onCollisionEnd = this.onCollisionEnd.bind(this);

    this.object3D = new Group();

    this.initGroundSensor();
    this.initPhysicsBody();
    this.initTerrainAngleSensor();
    this.initObject3D();

    emitter.on("onCollisionStart", this.onCollisionStart);
    emitter.on("onCollisionEnd", this.onCollisionEnd);
    document.addEventListener("keydown", this.onKeyDown);
  }

  // Lot of magic numbers here
  initObject3D() {
    const loader = new GLTFLoader();
    loader.load(playerGlbUrl, (gltf) => {
      const elephant = gltf.scene.children[0];
      const skate = gltf.scene.children[1];

      const fixMaterial = (o: Mesh<BufferGeometry, MeshBasicMaterial>) => {
        if (o.isMesh) {
          o.material = new MeshBasicMaterial({
            color: o.material.color,
            map: o.material.map,
          });
        }
      };

      elephant.traverse((o) => {
        fixMaterial(o as Mesh<BufferGeometry, MeshBasicMaterial>);
      });
      skate.traverse((o) => {
        fixMaterial(o as Mesh<BufferGeometry, MeshBasicMaterial>);
      });

      skate.position.y -= 0.5;
      elephant.position.y -= 0.5;

      const magicGroup = new Group();
      magicGroup.add(elephant);
      magicGroup.add(skate);
      magicGroup.rotateY(MathUtils.degToRad(90));
      magicGroup.scale.setScalar(50);

      this.object3D.add(magicGroup);
    });
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

  // This sensor checks for the terrain chunk segment right underneath player and copy its angle to the desired player rotation.
  initTerrainAngleSensor() {
    this.terrainAngleSensor = Bodies.rectangle(
      START_POS_X,
      START_POS_Y,
      DEBUG_PARAMS.player.terrainAngleSensor.width,
      DEBUG_PARAMS.player.terrainAngleSensor.height,
      {
        isSensor: true,
        isStatic: false,
        label: LABEL_TERRAIN_ANGLE_SENSOR,
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
        friction: 100,
        frictionStatic: 100,
        restitution: DEBUG_PARAMS.player.restitution,
        label: "player-body",
      },
      25
    );

    this.physicsBody = Body.create({
      parts: [body, this.groundSensor],
    });
  }

  update() {
    // Update ground angle sensor position to match body position
    // Sensor is not part of compound physic body because we want to keep
    // its rotation always facing down.
    Body.setPosition(this.terrainAngleSensor, {
      x: this.physicsBody.position.x,
      y:
        this.physicsBody.position.y +
        DEBUG_PARAMS.player.terrainAngleSensor.height / 2,
    });

    // Ground sensor can collide with multiple terrain chunks simultaneously.
    // Because of that, it is tricky to rely only on collide start / stop to update isGrounded.
    // Instead, we keep track of every terrain segment colliding with sensor and check if
    // any is currently colliding.
    this.isGrounded = this.collidingTerrainChunks.length > 0;

    // Autorotate based on terrain chunk angle sensor
    const angle = MathUtils.lerp(
      this.physicsBody.angle,
      this.desiredRotation,
      DEBUG_PARAMS.player.autoRotateLerpAmount
    );
    Body.setAngle(this.physicsBody, angle);
    this.object3D.rotation.z = -angle;

    // Prevent rotation, always stands up
    Body.setAngularVelocity(this.physicsBody, 0);

    // Continuously apply horizontal velocity
    Body.setVelocity(this.physicsBody, {
      x: DEBUG_PARAMS.player.velocity.x,
      y: this.physicsBody.velocity.y,
    });
  }

  jump() {
    Body.setVelocity(this.physicsBody, {
      x: this.physicsBody.velocity.x,
      y: DEBUG_PARAMS.player.velocity.jump,
    });
  }

  onKeyDown(e: KeyboardEvent) {
    if (e.code === "Space") {
      if (this.isGrounded) {
        this.jump();
      }
    }
  }

  onCollisionStart(e: IEventCollision<Engine>) {
    this.onTerrainAngleSensorCollisionStart(e.pairs);
    this.onGroundSensorCollisionStart(e.pairs);
  }

  onCollisionEnd(e: IEventCollision<Engine>) {
    this.onGroundSensorCollisionEnd(e.pairs);
  }

  onTerrainAngleSensorCollisionStart(pairs: Pair[]) {
    const terrainChunks = getCollidingTerrainChunks(
      pairs,
      LABEL_TERRAIN_ANGLE_SENSOR
    );

    if (terrainChunks.length) {
      this.desiredRotation = terrainChunks[0].angle;
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
}

export { Player };
