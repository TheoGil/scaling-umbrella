import {
  Box3,
  Box3Helper,
  BufferGeometry,
  CatmullRomCurve3,
  Group,
  Material,
  MathUtils,
  Mesh,
  Object3D,
} from "three";
import { frustumCuller } from "./frustumCulling";

class ParallaxElement {
  object3D = new Object3D();
  box = new Box3();
  helper: Box3Helper;

  constructor(mesh: Mesh) {
    this.object3D.add(mesh);

    this.box = new Box3();
    this.box.setFromObject(mesh);

    this.helper = new Box3Helper(this.box, 0xffff00);
    // this.object3D.add(this.helper);
  }
}

type MinMax = { min: number; max: number };

class ParallaxElements {
  pool: Mesh<BufferGeometry, Material>[] = [];
  elements: ParallaxElement[] = [];
  object3D = new Group();
  elementsOffset = {
    y: { min: 0, max: 0 },
    z: { min: 0, max: 0 },
  };
  elementsScale: MinMax;
  elementsRotation: MinMax;

  constructor({
    pool,
    elementsOffset,
    elementsScale,
    elementsRotation,
  }: {
    pool: Mesh<BufferGeometry, Material>[];
    elementsOffset: {
      x: number;
      y: MinMax;
      z: MinMax;
    };
    elementsScale: MinMax;
    elementsRotation: MinMax;
  }) {
    this.pool = pool;
    this.elementsOffset.y = elementsOffset.y;
    this.elementsOffset.z = elementsOffset.z;
    this.elementsScale = elementsScale;
    this.elementsRotation = elementsRotation;
  }

  // Brute force mesh positioning along curve
  spawn(curve: CatmullRomCurve3) {
    for (let p = 0; p < 1; p += 0.1) {
      const position = curve.getPointAt(p);
      const x = position.x;
      const y =
        -position.y +
        MathUtils.randFloat(
          this.elementsOffset.y.min,
          this.elementsOffset.y.max
        );
      const z = MathUtils.randFloat(
        this.elementsOffset.z.min,
        this.elementsOffset.z.max
      );

      const random = Math.floor(Math.random() * this.pool.length);

      const mesh = this.pool[random].clone();

      mesh.scale.setScalar(
        MathUtils.randFloat(this.elementsScale.min, this.elementsScale.max)
      );

      mesh.rotation.z = MathUtils.randFloat(
        this.elementsRotation.min,
        this.elementsRotation.max
      );

      mesh.position.set(x, y, z);

      const element = new ParallaxElement(mesh);

      const previousElement = this.elements[this.elements.length - 1];

      if (!previousElement || !element.box.intersectsBox(previousElement.box)) {
        this.elements.push(element);
        this.object3D.add(element.object3D);

        frustumCuller.add(element.object3D, () => {
          this.object3D.remove(element.object3D);
        });
      }
    }
  }
}

export { ParallaxElements };
