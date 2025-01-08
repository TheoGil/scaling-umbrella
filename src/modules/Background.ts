import { GLTF } from "three/examples/jsm/Addons.js";

import {
  Mesh,
  BufferGeometry,
  MeshStandardMaterial,
  DoubleSide,
  ShaderMaterial,
  Uniform,
  Color,
  Texture,
  Object3D,
  Vector3,
} from "three";

import colorMaskVertex from "../glsl/color-masking.vertex.glsl?raw";
import colorMaskFragment from "../glsl/color-masking.fragment.glsl?raw";
import { DEBUG_PARAMS } from "../settings";

type LICMesh = Mesh<BufferGeometry, MeshStandardMaterial | ShaderMaterial>;

class Background {
  LICMaterial: ShaderMaterial;
  object3D = new Object3D();
  background: LICMesh;
  backgroundSize = new Vector3();

  constructor(options: {
    gltf: GLTF;
    colorMaskRGB: Texture;
    colorMaskPWY: Texture;
    trailMask: Texture;
  }) {
    const LANDSCAPE_1_NAME = "landscape1";
    const BACKGROUND_NAME = "background";

    const landscape = options.gltf.scene.getObjectByName(
      LANDSCAPE_1_NAME
    ) as LICMesh;

    this.background = options.gltf.scene.getObjectByName(
      BACKGROUND_NAME
    ) as LICMesh;

    const colorMap = (landscape.material as MeshStandardMaterial).map;

    this.LICMaterial = new ShaderMaterial({
      vertexShader: colorMaskVertex,
      fragmentShader: colorMaskFragment,
      side: DoubleSide,
      uniforms: {
        uMap: new Uniform(colorMap),
        uColorMaskRGB: new Uniform(options.colorMaskRGB),
        uColorMaskPWY: new Uniform(options.colorMaskPWY),
        uDesaturation: new Uniform(DEBUG_PARAMS.colorMaskFX.desaturation),
        uRedsAmount: new Uniform(0),
        uGreensAmount: new Uniform(0),
        uBluesAmount: new Uniform(0),
        uPurplesAmount: new Uniform(0),
        uWhitesAmount: new Uniform(0),
        uYellowsAmount: new Uniform(0),
        uNightOverlayColor: new Uniform(
          new Color(DEBUG_PARAMS.colorMaskFX.night.color)
        ),
        uNightOverlayOpacity: new Uniform(1),
        uTrailMask: new Uniform(options.trailMask),
      },
    });

    landscape.material = this.LICMaterial;
    landscape.position.set(0.7, 1, 0);
    this.object3D.add(landscape);

    this.background.material = this.LICMaterial;
    this.background.material.wireframe = false;
    this.background.geometry.computeBoundingBox();
    this.background.geometry.boundingBox?.getSize(this.backgroundSize);
  }
}

export { Background };
