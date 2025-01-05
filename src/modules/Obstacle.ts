import {
  BufferGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshNormalMaterial,
  MeshStandardMaterial,
  SphereGeometry,
} from "three";
import { DEBUG_PARAMS } from "../settings";
import { Bodies, Body } from "matter-js";
import { GLTFLoader } from "three/examples/jsm/Addons.js";

import obstacleModelUrl from "/Traffic Barrier.glb?url";

const LABEL_OBSTACLE = "obstacle";

// const obstacleGeometry = new BoxGeometry(
//   DEBUG_PARAMS.obstacles.size.x,
//   DEBUG_PARAMS.obstacles.size.y,
//   DEBUG_PARAMS.obstacles.size.z
// );

const obstacleMaterial = new MeshNormalMaterial({
  wireframe: true,
});

// const obstacleMesh = new Mesh(obstacleGeometry, obstacleMaterial);

class Obstacle {
  object3D = new Group();
  physicsBody: Body;

  constructor(x: number, y: number) {
    // Invert Y beacause of the coordinates difference between canvas2D and threejs
    this.object3D.position.set(x, -y, 0);

    // Debug sphere just to visualize the physics collider
    this.object3D.add(
      new Mesh(
        new SphereGeometry(DEBUG_PARAMS.obstacles.collider.radius, 6, 6),
        obstacleMaterial
      )
    );

    // This is the actual "render mesh"
    // this.object3D.add(obstacleMesh.clone());

    const loader = new GLTFLoader();
    loader.load(obstacleModelUrl, (gltf) => {
      const basicMaterial = new MeshBasicMaterial({
        map: (
          gltf.scene.getObjectByName("TrafficBarrier_1") as Mesh<
            BufferGeometry,
            MeshStandardMaterial
          >
        ).material.map,
      });

      gltf.scene.traverse((o) => {
        if ((o as Mesh).isMesh) {
          (o as Mesh).material = basicMaterial;
        }
      });

      gltf.scene.scale.set(
        DEBUG_PARAMS.obstacles.size.x,
        DEBUG_PARAMS.obstacles.size.y,
        DEBUG_PARAMS.obstacles.size.z
      );
      this.object3D.add(gltf.scene);
    });

    this.physicsBody = Bodies.circle(
      x,
      y,
      DEBUG_PARAMS.obstacles.collider.radius,
      {
        isStatic: true,
        isSensor: true,
        label: LABEL_OBSTACLE,
      }
    );
  }
}

export { Obstacle, LABEL_OBSTACLE };
