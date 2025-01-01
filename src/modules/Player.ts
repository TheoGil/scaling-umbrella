import {
  BufferGeometry,
  Group,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  Object3D,
} from "three";
import { DEBUG_PARAMS } from "../settings";
import { Bodies, Body } from "matter-js";

import { GLTFLoader } from "three/examples/jsm/Addons.js";
import playerGlbUrl from "/player.glb?url";

class Player {
  object3D: Object3D;
  physicsBody: Body;

  constructor() {
    // this.onKeyDown = this.onKeyDown.bind(this);

    this.object3D = new Group();

    this.physicsBody = Bodies.circle(
      10,
      300,
      DEBUG_PARAMS.player.radius,
      {
        friction: 100,
        frictionStatic: 100,
        restitution: DEBUG_PARAMS.player.restitution,
      },
      25
    );

    // document.addEventListener("keydown", this.onKeyDown);
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

      this.object3D.add(elephant);
      this.object3D.add(skate);

      skate.position.y -= 0.5;
      elephant.position.y -= 0.5;

      this.object3D.rotateY(MathUtils.degToRad(90));
      this.object3D.scale.setScalar(50);
    });
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
