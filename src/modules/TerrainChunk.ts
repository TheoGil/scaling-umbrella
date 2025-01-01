import {
  CatmullRomCurve3,
  Color,
  Mesh,
  MeshBasicMaterial,
  MeshNormalMaterial,
  PlaneGeometry,
  TubeGeometry,
} from "three";
import { Body } from "matter-js";

import { DEBUG_PARAMS } from "../settings";
import { generateCurve, generatePhysicBodiesFromCurve } from "./curve";

class TerrainChunk {
  curve: CatmullRomCurve3;
  mesh: Mesh;
  bodies: Body[] = [];

  constructor(startX = 0, startY = innerHeight / 2) {
    this.curve = generateCurve({
      startPosition: {
        x: startX,
        y: startY,
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
      alternateAngle: DEBUG_PARAMS.segments.alternateAngle,
    });

    this.bodies = generatePhysicBodiesFromCurve(this.curve);

    const curveGeometry = new TubeGeometry(
      this.curve,
      DEBUG_PARAMS.segments.definition,
      1,
      8,
      false
    );
    curveGeometry.computeBoundingBox();

    const curveMaterial = new MeshBasicMaterial({
      color: new Color().setRGB(
        Math.random() * 0.5,
        Math.random() * 0.5,
        Math.random() * 0.5
      ),
    });
    this.mesh = new Mesh(curveGeometry, curveMaterial);

    // Invert Y axis
    // The curve is "designed" in canvas 2D coordinates system (positive Y is down)
    // but i flip that to render in threejs coordinates system (positive Y is up).
    // It might not be the most straightforward way to think about this "issue"
    // but this is working fine for now.
    this.mesh.scale.y = -1;

    // Composite.add(this.matterEngine!.world, bodies);
    // this.scene.add(curveMesh);
  }

  destroy() {
    console.log("TODO: Implémenter méthode destroy");
  }
}

export { TerrainChunk };
