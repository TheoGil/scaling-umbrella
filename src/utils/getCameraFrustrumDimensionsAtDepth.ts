import type { PerspectiveCamera } from "three";

function getCameraFrustrumDimensionsAtDepth(
  camera: PerspectiveCamera,
  depth = 0
) {
  const distance = camera.position.z - depth;
  const aspect = camera.aspect;
  const vFov = (camera.fov * Math.PI) / 180;
  const height = 2 * Math.tan(vFov / 2) * distance;
  const width = height * aspect;

  return {
    width,
    height,
  };
}

export { getCameraFrustrumDimensionsAtDepth };
