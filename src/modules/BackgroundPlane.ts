import { Mesh, BufferGeometry, ShaderMaterial, Object3D, Box3 } from "three";

class BackgroundPlane {
  object3D = new Object3D();
  scaleX: number;
  scaleY: number;

  constructor(mesh: Mesh<BufferGeometry, ShaderMaterial>) {
    const box = new Box3().setFromObject(mesh);

    const yOff = (box.max.y - Math.abs(box.min.y)) / -2;
    mesh.position.set(0, yOff, 0);

    this.scaleY = box.max.y - box.min.y;
    this.scaleX = box.max.x - box.min.x;

    this.object3D.add(mesh);
  }
}

export { BackgroundPlane };
