import { Input } from "phaser";

import { PARAMS } from "../params";
import { PrototypeScene } from "../main";
import { TERRAIN_CHUNK_PHYSICS_BODY_LABEL } from ".";

const GROUND_SENSOR_PHYSICS_BODY_LABEL = "ground-sensor";

class Player {
  scene: PrototypeScene;
  physicsBody: MatterJS.BodyType;
  groundSensor: MatterJS.BodyType;

  constructor(scene: PrototypeScene) {
    this.onCollisionStart = this.onCollisionStart.bind(this);

    this.scene = scene;

    this.physicsBody = this.scene.matter.add.rectangle(
      PARAMS.player.startPosition.x,
      PARAMS.player.startPosition.y,
      PARAMS.player.width,
      PARAMS.player.height,
      {
        chamfer: PARAMS.player.chamfer,
        friction: PARAMS.player.friction,
      }
    );

    this.groundSensor = this.scene.matter.add.rectangle(
      PARAMS.player.startPosition.x,
      PARAMS.player.startPosition.y,
      PARAMS.player.groundSensor.width,
      PARAMS.player.groundSensor.height,
      {
        isSensor: true,
        label: GROUND_SENSOR_PHYSICS_BODY_LABEL,
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

    this.scene.matter.world.on("collisionstart", this.onCollisionStart);
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

    // Jump logic
    if (this.scene.spacebar && Input.Keyboard.JustDown(this.scene.spacebar)) {
      this.scene.matter.body.setVelocity(this.physicsBody, {
        x: this.physicsBody.velocity.x,
        y: PARAMS.player.velocity.jump,
      });
    }

    // Move ground sensor to player position
    this.scene.matter.body.setPosition(
      this.groundSensor,
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

  onCollisionStart(
    _event: unknown,
    bodyA: MatterJS.BodyType,
    bodyB: MatterJS.BodyType
  ) {
    // Check if one of the bodies is sensor and the other one is terrain and vice versa
    const sensorCollidesWithTerrain =
      (bodyA.label === GROUND_SENSOR_PHYSICS_BODY_LABEL &&
        bodyB.label === TERRAIN_CHUNK_PHYSICS_BODY_LABEL) ||
      (bodyB.label === GROUND_SENSOR_PHYSICS_BODY_LABEL &&
        bodyA.label === TERRAIN_CHUNK_PHYSICS_BODY_LABEL);

    // If sensor collides with terrain, set player angle to terrain angle
    if (sensorCollidesWithTerrain) {
      const terrainBody =
        bodyA.label === TERRAIN_CHUNK_PHYSICS_BODY_LABEL ? bodyA : bodyB;

      this.scene.matter.body.setAngle(
        this.physicsBody,
        terrainBody.angle,
        false
      );
    }
  }
}

export { Player };
