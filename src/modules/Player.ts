import { Input, Math as PhaserMath } from "phaser";

import { PARAMS } from "../params";
import { PrototypeScene } from "../main";
import { TERRAIN_CHUNK_PHYSICS_BODY_LABEL } from ".";

const TERRAIN_ANGLE_SENSOR_LABEL = "terrain-rotation-sensor";

class Player {
  scene: PrototypeScene;
  physicsBody: MatterJS.BodyType;
  terrainAngleSensor: MatterJS.BodyType;
  groundSensor: MatterJS.BodyType;
  isGrounded = false;
  rotationTarget = 0;

  constructor(scene: PrototypeScene) {
    this.scene = scene;

    // Native Matter modules (for brevity)
    const { bodies, body } = this.scene.matter;

    const playerBody = bodies.rectangle(
      PARAMS.player.startPosition.x,
      PARAMS.player.startPosition.y,
      PARAMS.player.width,
      PARAMS.player.height,
      {
        chamfer: {
          radius: PARAMS.player.chamfer,
        },
        friction: PARAMS.player.friction,
        isStatic: true,
      }
    );

    this.groundSensor = bodies.rectangle(
      playerBody.position.x,
      playerBody.position.y + PARAMS.player.height / 2,
      PARAMS.player.width * 1.25,
      10,
      {
        isSensor: true,
      }
    );

    this.physicsBody = body.create({
      parts: [playerBody, this.groundSensor],
    });

    this.scene.matter.world.add(this.physicsBody);

    this.terrainAngleSensor = this.scene.matter.add.rectangle(
      PARAMS.player.startPosition.x,
      PARAMS.player.startPosition.y,
      PARAMS.player.groundSensor.width,
      PARAMS.player.groundSensor.height,
      {
        isSensor: true,
        label: TERRAIN_ANGLE_SENSOR_LABEL,
      }
    );

    // Debug code to move player body with mouse
    // this.scene.input.on("pointermove", ({ x, y }: PointerEvent) => {
    //   this.scene.matter.body.setPosition(
    //     this.physicsBody,
    //     {
    //       x: x,
    //       y: y,
    //     },
    //     false
    //   );
    // });

    this.scene.matterCollision.addOnCollideStart({
      objectA: [this.terrainAngleSensor],
      callback: this.onTerrainAngleSensorCollision,
      context: this,
    });

    this.scene.matterCollision.addOnCollideStart({
      objectA: [this.groundSensor],
      callback: this.onGroundSensorCollisionStart,
      context: this,
    });

    this.scene.matterCollision.addOnCollideEnd({
      objectA: [this.groundSensor],
      callback: this.onGroundSensorCollisionStop,
      context: this,
    });
  }

  update() {
    // Update camera scroll to follow player
    this.scene.cameras.main.setScroll(
      this.physicsBody.position.x -
        this.scene.scale.width / 2 +
        PARAMS.camera.offset.x,
      this.physicsBody.position.y -
        this.scene.scale.height / 2 +
        PARAMS.camera.offset.y
    );

    // Set player velocity
    this.scene.matter.body.setVelocity(this.physicsBody, {
      x: PARAMS.player.velocity.x,
      y: this.physicsBody.velocity.y,
    });

    // Set player rotation
    const rotationAngle = PhaserMath.Linear(
      this.physicsBody.angle,
      this.rotationTarget,
      PARAMS.player.terrainRotationLerp
    );
    this.scene.matter.body.setAngle(this.physicsBody, rotationAngle, false);

    // Jump logic
    if (
      this.scene.spacebar &&
      this.isGrounded &&
      Input.Keyboard.JustDown(this.scene.spacebar)
    ) {
      this.scene.matter.body.setVelocity(this.physicsBody, {
        x: this.physicsBody.velocity.x,
        y: PARAMS.player.velocity.jump,
      });
    }

    // Move ground sensor to player position
    this.scene.matter.body.setPosition(
      this.terrainAngleSensor,
      {
        x: this.physicsBody.position.x,
        y: this.physicsBody.position.y + PARAMS.player.groundSensor.height / 2,
      },
      false
    );
  }

  reset() {
    this.scene.matter.body.setPosition(
      this.physicsBody,
      {
        x: PARAMS.player.startPosition.x,
        y: PARAMS.player.startPosition.y,
      },
      false
    );

    this.scene.matter.body.setVelocity(this.physicsBody, {
      x: 0,
      y: 0,
    });
  }

  onTerrainAngleSensorCollision({
    bodyA: _sensor,
    bodyB: terrain,
  }: {
    bodyA: MatterJS.BodyType;
    bodyB: MatterJS.BodyType;
  }) {
    if (terrain.label === TERRAIN_CHUNK_PHYSICS_BODY_LABEL) {
      this.rotationTarget = terrain.angle;
    }
  }

  onGroundSensorCollisionStart({
    bodyA: _sensor,
    bodyB: terrain,
  }: {
    bodyA: MatterJS.BodyType;
    bodyB: MatterJS.BodyType;
  }) {
    if (
      !this.isGrounded &&
      terrain.label === TERRAIN_CHUNK_PHYSICS_BODY_LABEL
    ) {
      this.isGrounded = true;
    }
  }

  onGroundSensorCollisionStop({
    bodyA: _sensor,
    bodyB: terrain,
  }: {
    bodyA: MatterJS.BodyType;
    bodyB: MatterJS.BodyType;
  }) {
    if (this.isGrounded && terrain.label === TERRAIN_CHUNK_PHYSICS_BODY_LABEL) {
      this.isGrounded = false;
    }
  }
}

export { Player };
