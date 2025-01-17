import {
  Group,
  Mesh,
  Object3D,
  PlaneGeometry,
  ShaderMaterial,
  Uniform,
  Vector3,
  Vector3Like,
} from "three";
import type { TerrainChunk } from "./TerrainChunk";
import { frustumCuller } from "./frustumCulling";
import { DEBUG_PARAMS } from "../settings";
import { Bodies, Body, Composite } from "matter-js";
import { emitter } from "./emitter";

const dummyVec3 = new Vector3();

function getPillPosition(
  terrainChunk: TerrainChunk,
  p: number,
  offset: number
) {
  terrainChunk.curve.getPointAt(p, dummyVec3);

  // https://github.com/Pomax/bezierjs/blob/master/src/bezier.js#L520
  return new Vector3(dummyVec3.x + offset * 0, dummyVec3.y + offset * 1, 0);
}

import pillFlareVertex from "../glsl/radial-lens-flare.vertex.glsl?raw";
import pillFlareFragment from "../glsl/radial-lens-flare.fragment.glsl?raw";

const LABEL_PILL = "pill";

class Pill {
  flares = new Group();
  pill = new Group();
  planes: Mesh<PlaneGeometry, ShaderMaterial>[] = [];
  physicsBody = Bodies.circle(0, 0, DEBUG_PARAMS.pills.physicsBodyRadius, {
    isSensor: true,
    isStatic: true,
    label: LABEL_PILL,
  });
  index: number;
  uniformName: string;

  constructor(mesh: Object3D, index: number, uniformName: string) {
    this.index = index;
    this.uniformName = uniformName;

    mesh.scale.setScalar(DEBUG_PARAMS.pills.scale);
    mesh.position.set(0, 0, 0);
    this.pill.add(mesh);

    const planeGeometry = new PlaneGeometry(
      DEBUG_PARAMS.pills.scale,
      DEBUG_PARAMS.pills.scale
    );

    const planeMaterial = new ShaderMaterial({
      transparent: true,
      vertexShader: pillFlareVertex,
      fragmentShader: pillFlareFragment,
      uniforms: {
        uTime: new Uniform(0),
        uEdge: new Uniform(0),
        uStep: new Uniform(0),
        uSpeed: new Uniform(0),
        uColor: new Uniform(null),
        uOffset: new Uniform(Math.random() * 1000),
      },
    });

    // Useful to visually debug the collider
    // this.pill.add(
    //   new Mesh(
    //     new SphereGeometry(DEBUG_PARAMS.pills.physicsBodyRadius, 6, 6),
    //     new MeshBasicMaterial({
    //       color: 0xff0000,
    //       wireframe: true,
    //     })
    //   )
    // );

    for (let i = 0; i < 3; i++) {
      const plane = new Mesh(planeGeometry, planeMaterial.clone());

      plane.position.z = -5;

      plane.scale.set(
        DEBUG_PARAMS.pills.flares.layers[i].scale,
        DEBUG_PARAMS.pills.flares.layers[i].scale,
        1
      );

      plane.material.uniforms.uEdge.value =
        DEBUG_PARAMS.pills.flares.layers[i].edges;

      plane.material.uniforms.uStep.value =
        DEBUG_PARAMS.pills.flares.layers[i].step;

      plane.material.uniforms.uSpeed.value =
        DEBUG_PARAMS.pills.flares.layers[i].speed;

      plane.material.uniforms.uColor.value =
        DEBUG_PARAMS.pills.flares.colors[index][i];

      this.planes.push(plane);

      this.flares.add(plane);
    }
  }

  update(time: number) {
    this.planes.forEach((p) => {
      p.material.uniforms.uTime.value = time;
    });
  }

  addToWorld(position: Vector3Like, scene: Object3D, composite: Composite) {
    this.pill.position.set(position.x, -position.y, 0);
    scene.add(this.pill);

    this.flares.position.copy(this.pill.position);
    scene.add(this.flares);

    Body.setPosition(this.physicsBody, { x: position.x, y: position.y });
    Composite.add(composite, this.physicsBody);
  }

  removeFromWorld(scene: Object3D, composite: Composite) {
    scene.remove(this.pill);
    scene.remove(this.flares);
    Composite.remove(composite, this.physicsBody);
  }
}

const pillManager = {
  pills: [] as Pill[],
  currentPillIndex: 0,
  goToNext() {
    if (this.currentPillIndex < this.pills.length - 1) {
      this.currentPillIndex++;

      if (this.currentPillIndex === this.pills.length - 1) {
        emitter.emit("onGameComplete");
      }
    }
  },
  spawnPill({
    terrainChunk,
    scene,
    composite,
    progress,
    pillIndex,
  }: {
    terrainChunk: TerrainChunk;
    scene: Object3D;
    composite: Composite;
    progress: number;
    pillIndex: number;
  }) {
    const pill = this.pills[pillIndex];

    const pillPosition = getPillPosition(
      terrainChunk,
      progress,
      DEBUG_PARAMS.pills.terrainOffset
    );

    pill.addToWorld(
      {
        x: pillPosition.x,
        y: pillPosition.y,
        z: 0,
      },
      scene,
      composite
    );

    frustumCuller.add(pill.pill, () => {
      emitter.emit("onPillLeaveFrustum");
    });
  },
  init(
    pill1: Object3D,
    pill2: Object3D,
    pill3: Object3D,
    pill4: Object3D,
    pill5: Object3D,
    pill6: Object3D
  ) {
    this.pills.push(new Pill(pill1, 0, "uBluesAmount"));
    this.pills.push(new Pill(pill2, 1, "uRedsAmount"));
    this.pills.push(new Pill(pill3, 2, "uGreensAmount"));
    this.pills.push(new Pill(pill4, 3, "uYellowsAmount"));
    this.pills.push(new Pill(pill5, 4, "uPurplesAmount"));
    this.pills.push(new Pill(pill6, 5, "uWhitesAmount"));
  },
  update(time: number) {
    this.pills.forEach((p) => {
      p.update(time);
    });
  },
};

export { pillManager, getPillPosition, LABEL_PILL };
