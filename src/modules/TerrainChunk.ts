import {
  Box3,
  BufferGeometry,
  CatmullRomCurve3,
  Group,
  InstancedMesh,
  Material,
  Mesh,
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
  instancedMesh?: InstancedMesh<BufferGeometry, Material>;

  constructor(
    x = 0,
    y = innerHeight / 2,
    index: number,
    groundMesh: Mesh<BufferGeometry, MeshBasicMaterial>
  ) {
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

    this.initBoundingBox();
    this.initMesh(groundMesh);

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

  initBoundingBox() {
    const geometry = new TubeGeometry(
      this.curve,
      this.tubularSegments,
      1,
      8,
      false
    );

    geometry.computeBoundingBox();

    this.boundingBox.copy(geometry.boundingBox!);
  }

  initMesh(groundMesh: Mesh<BufferGeometry, MeshBasicMaterial>) {
    this.instancedMesh = new InstancedMesh(
      groundMesh.geometry,
      groundMesh.material,
      this.tubularSegments
    );

    this.instancedMesh.instanceMatrix.setUsage(StaticDrawUsage);

    const points = this.curve.getSpacedPoints(this.tubularSegments);

    points.forEach((point, i) => {
      dummyObject3D.position.set(
        point.x,
        point.y + DEBUG_PARAMS.terrain.model.positionYOffset,
        point.z
      );

      dummyObject3D.scale.set(
        1,
        DEBUG_PARAMS.terrain.model.scale.y,
        DEBUG_PARAMS.terrain.model.scale.z
      );

      if (i < points.length - 1) {
        const nextPoint = points[i + 1];

        // Compute the angle difference between point and nextpoint,
        // use this for the z rotation
        const angle = Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x);
        dummyObject3D.rotation.set(0, 0, angle);

        // Compute the distance between point and nextpoint,
        // use this for the X scale.
        const a = point.x - nextPoint.x;
        const b = point.y - nextPoint.y;
        dummyObject3D.scale.x =
          Math.sqrt(a * a + b * b) *
          DEBUG_PARAMS.terrain.model.xScaleMultiplier;
      }

      dummyObject3D.updateMatrix();

      this.instancedMesh?.setMatrixAt(i, dummyObject3D.matrix);
    });

    this.object3D.add(this.instancedMesh);
  }

  destroy() {
    console.log("TODO: Implémenter méthode destroy");
  }
}

export { TerrainChunk };
