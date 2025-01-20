import {
  AnimationAction,
  AnimationMixer,
  BoxGeometry,
  BufferGeometry,
  Color,
  DoubleSide,
  LoopOnce,
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

export type PlayerAnimations = {
  falling: AnimationAction;
  jumping: AnimationAction;
  landing: AnimationAction;
  sliding: AnimationAction;
};

import colorMaskVertex from "../glsl/color-masking.vertex.glsl?raw";
import colorMaskFragment from "../glsl/color-masking.fragment.glsl?raw";

import { AssetsManager } from "./AssetsManager";
import { DEBUG_PARAMS } from "../settings";

const LANDSCAPE_1_NAME = "landscape1";
const LANDSCAPE_2_NAME = "landscape2";
const LANDSCAPE_3_NAME = "landscape3";
const LANDSCAPE_4_NAME = "landscape4";
const BACKGROUND_NAME = "background";
const PILL1_NAME = "pillBlue";
const PILL2_NAME = "pillRed";
const PILL3_NAME = "pillGreen";
const PILL4_NAME = "pillYellow";
const PILL5_NAME = "pillPurples";
const PILL6_NAME = "pillWhite";
const PLAYER_NAME = "ski";
const OBSTACLE_NAME = "obstacle";
const CLOUD_1_NAME = "cloud";
const CLOUD_2_NAME = "cloud2";
const CLOUD_3_NAME = "cloud3";

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

  const cloud1 = gltf.scene.getObjectByName(CLOUD_1_NAME) as Mesh<
    BufferGeometry,
    ShaderMaterial
  >;

  const cloud2 = gltf.scene.getObjectByName(CLOUD_2_NAME) as Mesh<
    BufferGeometry,
    ShaderMaterial
  >;

  const cloud3 = gltf.scene.getObjectByName(CLOUD_3_NAME) as Mesh<
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

  const pill1 = gltf.scene.getObjectByName(PILL1_NAME) as Mesh<
    BufferGeometry,
    MeshBasicMaterial
  >;

  const pill2 = gltf.scene.getObjectByName(PILL2_NAME) as Mesh<
    BufferGeometry,
    MeshBasicMaterial
  >;

  const pill3 = gltf.scene.getObjectByName(PILL3_NAME) as Mesh<
    BufferGeometry,
    MeshBasicMaterial
  >;

  const pill4 = gltf.scene.getObjectByName(PILL4_NAME) as Mesh<
    BufferGeometry,
    MeshBasicMaterial
  >;

  const pill5 = gltf.scene.getObjectByName(PILL5_NAME) as Mesh<
    BufferGeometry,
    MeshBasicMaterial
  >;

  const pill6 = gltf.scene.getObjectByName(PILL6_NAME) as Mesh<
    BufferGeometry,
    MeshBasicMaterial
  >;

  const obstacle = gltf.scene.getObjectByName(OBSTACLE_NAME) as Mesh<
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
      uTime: new Uniform(0),
      uScrollSpeed: new Uniform(0),
    },
  });

  const backgroundPlaneTexture = (
    background.material as unknown as MeshStandardMaterial
  ).map;
  const backgroundPlaneMaterial = colorMaskMaterial.clone();
  backgroundPlaneMaterial.uniforms.uMap.value = backgroundPlaneTexture;
  backgroundPlaneMaterial.uniforms.uScrollSpeed.value = 0.0005;
  backgroundPlaneMaterial.uniforms.uColorMaskRGB.value =
    assetsManager.get<Texture>("color-mask-background");
  backgroundPlaneMaterial.uniforms.uColorMaskPWY.value =
    assetsManager.get<Texture>("color-mask-background");

  // Setup the shared unlit basic material
  const basicMaterial = new MeshBasicMaterial({
    map: baseTexture,
    side: DoubleSide,
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

  pill1.material = basicMaterial;
  pill2.material = basicMaterial;
  pill3.material = basicMaterial;
  pill4.material = basicMaterial;
  pill5.material = basicMaterial;
  pill6.material = basicMaterial;
  obstacle.material = basicMaterial;
  background.material = backgroundPlaneMaterial;
  landscape1.material = colorMaskMaterial;
  landscape2.material = colorMaskMaterial;
  landscape3.material = colorMaskMaterial;
  landscape4.material = colorMaskMaterial;
  cloud1.material = colorMaskMaterial;
  cloud2.material = colorMaskMaterial;
  cloud3.material = colorMaskMaterial;

  const cloudBoxZHelperMesh = new Mesh(
    new BoxGeometry(),
    new MeshBasicMaterial({
      wireframe: true,
      visible: false,
    })
  );
  cloud1.position.set(0, 0, 0);
  cloud1.add(cloudBoxZHelperMesh.clone());

  cloud2.position.set(0, 0, 0);
  cloud2.add(cloudBoxZHelperMesh.clone());

  cloud3.position.set(0, 0, 0);
  cloud3.add(cloudBoxZHelperMesh.clone());

  const animationMixer = new AnimationMixer(gltf.scene);
  const animations: PlayerAnimations = {
    falling: animationMixer.clipAction(gltf.animations[0]),
    jumping: animationMixer.clipAction(gltf.animations[1]),
    landing: animationMixer.clipAction(gltf.animations[2]),
    sliding: animationMixer.clipAction(gltf.animations[3]),
  };

  animations.falling.clampWhenFinished = true;
  animations.falling.loop = LoopOnce;

  animations.landing.clampWhenFinished = true;
  animations.landing.loop = LoopOnce;

  return {
    models: {
      background,
      landscape1,
      landscape2,
      landscape3,
      landscape4,
      pill1,
      pill2,
      pill3,
      pill4,
      pill5,
      pill6,
      player,
      obstacle,
      cloud1,
      cloud2,
      cloud3,
    },
    materials: { colorMaskMaterial, basicMaterial, backgroundPlaneMaterial },
    animationMixer,
    animations,
  };
}

export { parseScene };
