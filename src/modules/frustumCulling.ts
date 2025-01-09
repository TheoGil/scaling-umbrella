import { Box3, Box3Helper, Object3D, PerspectiveCamera } from "three";
import { getCameraFrustrumDimensionsAtDepth } from "../utils/getCameraFrustrumDimensionsAtDepth";

type OnLeaveFrustumCB = () => void;
type CulledObject = {
  box: Box3;
  onLeaveFrustumCB: OnLeaveFrustumCB;
  helper?: Box3Helper;
};

const SAFE_PADDING = 100;
const DEBUG = true;

const frustumCuller = {
  objects: [] as CulledObject[],

  object3D: new Object3D(),

  add(object: Object3D, onLeaveFrustumCB: OnLeaveFrustumCB) {
    const box = new Box3().setFromObject(object);

    const cullObject: CulledObject = {
      box,
      onLeaveFrustumCB: onLeaveFrustumCB,
    };

    if (DEBUG) {
      cullObject.helper = new Box3Helper(box, 0xfff000);
      this.object3D.add(cullObject.helper);
    }

    this.objects.push(cullObject);
  },

  update(camera: PerspectiveCamera) {
    for (let i = this.objects.length - 1; i >= 0; i--) {
      const { box, onLeaveFrustumCB, helper } = this.objects[i];

      const { width: cameraFrustrumWidth } = getCameraFrustrumDimensionsAtDepth(
        camera,
        box.min.z
      );

      const leftEdgePosition = camera.position.x - cameraFrustrumWidth / 2;

      if (box.max.x < leftEdgePosition - SAFE_PADDING) {
        onLeaveFrustumCB();
        this.objects.splice(i, 1);

        if (helper) {
          this.object3D.remove(helper);
        }
      }
    }
  },
};

frustumCuller.object3D.name = "frustumCuller";

export { frustumCuller };
