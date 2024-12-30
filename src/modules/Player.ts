import { Mesh, MeshNormalMaterial, SphereGeometry } from "three";
import { DEBUG_PARAMS } from "../settings";
import { Bodies, Body } from "matter-js";

class Player {
  mesh: Mesh;
  physicsBody: Body;

  constructor() {
    // this.onKeyDown = this.onKeyDown.bind(this);

    this.mesh = new Mesh(
      new SphereGeometry(DEBUG_PARAMS.player.radius),
      new MeshNormalMaterial()
    );

    this.physicsBody = Bodies.circle(
      10,
      300,
      DEBUG_PARAMS.player.radius,
      {
        friction: 0,
        frictionStatic: 0,
      },
      25
    );

    // document.addEventListener("keydown", this.onKeyDown);
  }

  update() {
    // Continuously apply horizontal velocity
    Body.setVelocity(this.physicsBody, {
      x: DEBUG_PARAMS.player.velocity.x,
      y: this.physicsBody.velocity.y,
    });
  }

  //   onKeyDown(e: KeyboardEvent) {
  //     if (e.code === "Space") {
  //       if (this.isGrounded) {
  //         this.doJump();
  //       } else {
  //         this.doBackflip();
  //       }
  //     }
  //   }
}

export { Player };
