import {
  BufferGeometry,
  Color,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  ShaderMaterial,
  SkinnedMesh,
  Texture,
  Uniform,
} from "three";
import { GLTF } from "three/examples/jsm/Addons.js";

type RawPlayerMesh =
  | Mesh<BufferGeometry, MeshStandardMaterial>
  | SkinnedMesh<BufferGeometry, MeshStandardMaterial>;

import colorMaskVertex from "../glsl/color-masking.vertex.glsl?raw";
import colorMaskFragment from "../glsl/color-masking.fragment.glsl?raw";
import { AssetsManager } from "./AssetsManager";
import { DEBUG_PARAMS } from "../settings";

const LANDSCAPE_1_NAME = "landscape1";
const LANDSCAPE_2_NAME = "landscape2";
const LANDSCAPE_3_NAME = "landscape3";
const LANDSCAPE_4_NAME = "landscape4";
const BACKGROUND_NAME = "background";
const PLAYER_NAME = "ski";

/**
 * Parse GLTF content, retrieve models and update their materials
 */
function parseScene(assetsManager: AssetsManager) {
  const gltf = assetsManager.get<GLTF>("LIC");

  const landscape1 = gltf.scene.getObjectByName(LANDSCAPE_1_NAME) as Mesh<
    BufferGeometry,
    ShaderMaterial
  >;

  const landscape2 = gltf.scene.getObjectByName(LANDSCAPE_2_NAME) as Mesh<
    BufferGeometry,
    ShaderMaterial
  >;

  const landscape3 = gltf.scene.getObjectByName(LANDSCAPE_3_NAME) as Mesh<
    BufferGeometry,
    ShaderMaterial
  >;

  const landscape4 = gltf.scene.getObjectByName(LANDSCAPE_4_NAME) as Mesh<
    BufferGeometry,
    ShaderMaterial
  >;

  const background = gltf.scene.getObjectByName(BACKGROUND_NAME) as Mesh<
    BufferGeometry,
    ShaderMaterial
  >;

  const player = gltf.scene.getObjectByName(PLAYER_NAME) as Mesh<
    BufferGeometry,
    MeshBasicMaterial
  >;

  // Retrieve the base texture from the landscape1 model but it could be from any model
  const baseTexture = (landscape1.material as unknown as MeshStandardMaterial)
    .map;

  // Setup the shared "color mask" material
  const colorMaskRGB = assetsManager.get<Texture>("color-mask-rgb");
  const colorMaskPWY = assetsManager.get<Texture>("color-mask-pwy");
  const colorMaskMaterial = new ShaderMaterial({
    vertexShader: colorMaskVertex,
    fragmentShader: colorMaskFragment,
    side: DoubleSide,
    uniforms: {
      uMap: new Uniform(baseTexture),
      uColorMaskRGB: new Uniform(colorMaskRGB),
      uColorMaskPWY: new Uniform(colorMaskPWY),
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
      uTrailMask: new Uniform(null),
    },
  });

  // Setup the shared unlit basic material
  const basicMaterial = new MeshBasicMaterial({
    map: baseTexture,
  });

  // Update the player model material
  player.traverse((object) => {
    if (
      (object.type === "Mesh" || object.type === "SkinnedMesh") &&
      (object as RawPlayerMesh).material
    ) {
      (object as Mesh<BufferGeometry, MeshBasicMaterial>).material =
        basicMaterial;
    }
  });

  background.material = colorMaskMaterial;
  landscape1.material = colorMaskMaterial;
  landscape2.material = colorMaskMaterial;
  landscape3.material = colorMaskMaterial;
  landscape4.material = colorMaskMaterial;

  return {
    models: {
      background,
      landscape1,
      landscape2,
      landscape3,
      landscape4,
      player,
    },
    materials: { colorMaskMaterial, basicMaterial },
  };
}

export { parseScene };
