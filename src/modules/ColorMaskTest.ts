import { GLTF } from "three/examples/jsm/Addons.js";

import {
  Mesh,
  BufferGeometry,
  MeshStandardMaterial,
  DoubleSide,
  ShaderMaterial,
  Uniform,
  LinearSRGBColorSpace,
  Color,
  Texture,
  Object3D,
} from "three";

import colorMaskVertex from "../glsl/color-masking.vertex.glsl?raw";
import colorMaskFragment from "../glsl/color-masking.fragment.glsl?raw";
import { DEBUG_PARAMS } from "../settings";

class ColorMasktest {
  LICMaterial: ShaderMaterial;
  object3D = new Object3D();

  constructor(options: {
    gltf: GLTF;
    colorMaskRGB: Texture;
    colorMaskPWY: Texture;
  }) {
    type LICMesh = Mesh<BufferGeometry, MeshStandardMaterial | ShaderMaterial>;

    const LANDSCAPE_1_NAME = "landscape1";
    const BACKGROUND_NAME = "background";

    const landscape = options.gltf.scene.getObjectByName(
      LANDSCAPE_1_NAME
    ) as LICMesh;
    const background = options.gltf.scene.getObjectByName(
      BACKGROUND_NAME
    ) as LICMesh;

    const colorMap = (landscape.material as MeshStandardMaterial).map;
    colorMap!.colorSpace = LinearSRGBColorSpace; // Fixes "texture too dark" issue

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
        uNightOverlayColor: new Uniform(new Color(0x3f51b5)),
        uNightOverlayOpacity: new Uniform(1),
      },
    });

    landscape.material = this.LICMaterial;
    landscape.position.set(0.7, 1, 0);
    this.object3D.add(landscape);

    background.material = this.LICMaterial;
    this.object3D.add(background);
  }
}

export { ColorMasktest };
