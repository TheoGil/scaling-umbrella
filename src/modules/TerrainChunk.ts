import {
  Box3,
  BoxGeometry,
  CatmullRomCurve3,
  Color,
  Group,
  InstancedMesh,
  MeshBasicMaterial,
  Object3D,
  StaticDrawUsage,
  TubeGeometry,
} from "three";
import { Body } from "matter-js";

import { DEBUG_PARAMS } from "../settings";
import { generateCurve, generatePhysicBodiesFromCurve } from "./curve";

const dummyObject3D = new Object3D();

class TerrainChunk {
  curve: CatmullRomCurve3;
  object3D: Object3D;
  bodies: Body[] = [];
  instancedRailroadTies!: InstancedMesh;
  tubularSegments: number;
  boundingBox = new Box3();
  index: number;

  constructor(x = 0, y = innerHeight / 2, index = 0) {
    this.index = index;
    this.object3D = new Group();

    const alternateAngle =
      this.index !== 0 &&
      this.index % DEBUG_PARAMS.segments.alternateAngleEveryNTHChunk === 0;

    this.curve = generateCurve({
      startPosition: {
        x,
        y,
        z: 0,
      },
      segmentsCount: DEBUG_PARAMS.segments.count,
      segmentsAngle: {
        min: DEBUG_PARAMS.segments.angle.min,
        max: DEBUG_PARAMS.segments.angle.max,
      },
      segmentsLength: {
        min: DEBUG_PARAMS.segments.length.min,
        max: DEBUG_PARAMS.segments.length.max,
      },
      alternateAngle,
    });

    this.tubularSegments = this.computeTubularSegments();

    this.bodies = generatePhysicBodiesFromCurve(
      this.curve,
      this.tubularSegments
    );

    this.initRailProfiles();
    this.initRailTies();

    // Invert Y axis
    // The curve is "designed" in canvas 2D coordinates system (positive Y is down)
    // but i flip that to render in threejs coordinates system (positive Y is up).
    // It might not be the most straightforward way to think about this "issue"
    // but this is working fine for now.
    this.object3D.scale.y = -1;
  }

  computeTubularSegments() {
    return Math.round(
      this.curve.getLength() / DEBUG_PARAMS.segments.definition
    );
  }

  initRailProfiles() {
    const geometry = new TubeGeometry(
      this.curve,
      this.tubularSegments,
      1,
      8,
      false
    );

    geometry.computeBoundingBox();
    this.boundingBox.copy(geometry.boundingBox!);

    const material = new MeshBasicMaterial({
      color: new Color(DEBUG_PARAMS.terrain.profiles.color),
    });

    /*
    new Color().setRGB(
        Math.random() * 0.5,
        Math.random() * 0.5,
        Math.random() * 0.5
  )
      */

    const count = 2;
    const mesh = new InstancedMesh(geometry, material, count);
    mesh.instanceMatrix.setUsage(StaticDrawUsage);

    for (let i = 0; i < count; i++) {
      dummyObject3D.position.set(
        0,
        0,
        DEBUG_PARAMS.terrain.profiles.depth * i -
          DEBUG_PARAMS.terrain.profiles.depth / 2
      );
      dummyObject3D.updateMatrix();
      mesh.setMatrixAt(i, dummyObject3D.matrix);
    }

    this.object3D.add(mesh);
  }

  initRailTies() {
    const material = new MeshBasicMaterial({
      color: DEBUG_PARAMS.terrain.ties.color,
    });

    const geometry = new BoxGeometry(
      DEBUG_PARAMS.terrain.ties.width,
      DEBUG_PARAMS.terrain.ties.height,
      DEBUG_PARAMS.terrain.ties.depth
    );

    const instancedRailroadTies = new InstancedMesh(
      geometry,
      material,
      this.tubularSegments
    );
    instancedRailroadTies.instanceMatrix.setUsage(StaticDrawUsage);

    this.curve.getSpacedPoints(this.tubularSegments).forEach((point, i) => {
      dummyObject3D.position.set(point.x, point.y + 5, point.z);
      dummyObject3D.updateMatrix();
      instancedRailroadTies.setMatrixAt(i, dummyObject3D.matrix);
    });

    this.object3D.add(instancedRailroadTies);
  }

  destroy() {
    console.log("TODO: Implémenter méthode destroy");
  }
}

export { TerrainChunk };
