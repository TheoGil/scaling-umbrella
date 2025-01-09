import { Object3D, Vector3 } from "three";
import type { TerrainChunk } from "./TerrainChunk";
import { frustumCuller } from "./frustumCulling";
import { DEBUG_PARAMS } from "../settings";
import { Bodies, Body } from "matter-js";
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

const LABEL_PILL = "pill";

const pillManager = {
  canSpawnPill: true,
  object3D: new Object3D(),
  pills: [
    {
      name: "pill1",
      uniformName: "uBluesAmount",
      object3D: undefined,
    },
    {
      name: "pill2",
      uniformName: "uRedsAmount",
      object3D: undefined,
    },
    {
      name: "pill3",
      uniformName: "uGreensAmount",
      object3D: undefined,
    },
    {
      name: "pill4",
      uniformName: "uYellowsAmount",
      object3D: undefined,
    },
    {
      name: "pill5",
      uniformName: "uPurplesAmount",
      object3D: undefined,
    },
    {
      name: "pill6",
      uniformName: "uWhitesAmount",
      object3D: undefined,
    },
  ] as { name: string; uniformName: string; object3D?: Object3D }[],
  currentPillIndex: 0,
  physicsBody: Bodies.circle(0, 0, DEBUG_PARAMS.pills.physicsBodyRadius, {
    isSensor: true,
    isStatic: true,
    label: LABEL_PILL,
  }),
  goToNext() {
    if (this.currentPillIndex < this.pills.length - 1) {
      this.currentPillIndex++;

      if (this.currentPillIndex === this.pills.length - 1) {
        emitter.emit("onGameComplete");
      }
    }
  },
  goToPrev() {
    if (this.currentPillIndex > 0) {
      this.currentPillIndex--;
    }
  },
  spawnPill(terrainChunk: TerrainChunk) {
    const object3D = this.pills[this.currentPillIndex].object3D;

    if (object3D) {
      this.canSpawnPill = false;

      const pillPosition = getPillPosition(
        terrainChunk,
        0.5,
        DEBUG_PARAMS.pills.terrainOffset
      );

      object3D.visible = true;
      this.object3D.position.set(pillPosition.x, -pillPosition.y, 0);

      Body.setPosition(this.physicsBody, {
        x: pillPosition.x,
        y: pillPosition.y,
      });

      frustumCuller.add(this.object3D, () => {
        object3D.visible = false;
        this.canSpawnPill = true;
      });
    }
  },
  init(
    pill1: Object3D,
    pill2: Object3D,
    pill3: Object3D,
    pill4: Object3D,
    pill5: Object3D,
    pill6: Object3D
  ) {
    this.pills[0].object3D = pill1;
    this.pills[1].object3D = pill2;
    this.pills[2].object3D = pill3;
    this.pills[3].object3D = pill4;
    this.pills[4].object3D = pill5;
    this.pills[5].object3D = pill6;

    this.pills.forEach((pill) => {
      if (pill.object3D) {
        pill.object3D.visible = false;
        pill.object3D.scale.setScalar(DEBUG_PARAMS.pills.scale);
        this.object3D.add(pill.object3D);
      }
    });

    // Useful to visually debug the collider
    // this.object3D.add(
    //   new Mesh(
    //     new SphereGeometry(DEBUG_PARAMS.pills.physicsBodyRadius, 6, 6),
    //     new MeshBasicMaterial({
    //       color: 0xff0000,
    //       wireframe: true,
    //     })
    //   )
    // );
  },
};

export { pillManager, getPillPosition, LABEL_PILL };
