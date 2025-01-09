import {
  Group,
  Mesh,
  MeshNormalMaterial,
  SphereGeometry,
  Vector3,
} from "three";
import { TerrainChunk } from "./TerrainChunk";

const pillGeometry = new SphereGeometry(10);

const pillMaterial = new MeshNormalMaterial({
  wireframe: true,
});

const pillMesh = new Mesh(pillGeometry, pillMaterial);

class Pill {
  object3D = new Group();

  constructor(x: number, y: number) {
    this.object3D.position.set(x, y, 0);
    this.object3D.add(pillMesh.clone());
  }
}

function attachPillToTerrainChunk(terrainChunk: TerrainChunk) {
  const offset = -200;

  const nv = new Vector3(0, 1, 0);

  // https://github.com/Pomax/bezierjs/blob/master/src/bezier.js#L520
  terrainChunk.curve.points
    .map((p) => new Vector3(p.x + offset * nv.x, p.y + offset * nv.y, 0))
    .forEach((p) => {
      const pill = new Pill(p.x, p.y);
      terrainChunk.object3D.add(pill.object3D);
    });
}

export { Pill, attachPillToTerrainChunk };
