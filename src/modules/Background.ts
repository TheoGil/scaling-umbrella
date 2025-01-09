import {
  Mesh,
  BufferGeometry,
  MeshStandardMaterial,
  ShaderMaterial,
} from "three";

type LICMesh = Mesh<BufferGeometry, MeshStandardMaterial | ShaderMaterial>;

class Background {
  background: LICMesh;

  constructor(mesh: Mesh<BufferGeometry, ShaderMaterial>) {
    this.background = mesh;
  }
}

export { Background };
