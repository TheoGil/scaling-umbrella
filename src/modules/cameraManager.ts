import {
  Box3,
  BoxGeometry,
  CameraHelper,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Scene,
  Vector2Like,
  Vector3,
} from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import { DEBUG_PARAMS } from "../settings";
import { Player } from "./Player";
import { TerrainChunk } from "./TerrainChunk";
import { raycast } from "../utils/raycast";
import { Vector } from "matter-js";
import { gameIsPlaying } from "./store";
import gsap from "gsap";

const perspectiveCamera = new PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  1,
  5000
);

const cameraHelper = new CameraHelper(perspectiveCamera);

const debugCamera = perspectiveCamera.clone();

const TEMP_LOOKAT = new Vector3();
const TEMP_ZBOXFIT = new Box3();
const TEMP_ZBOXSIZEFIT = new Vector3();

const DEBUG_FOCUS_AREA_MESH = new Mesh(
  new BoxGeometry(),
  new MeshBasicMaterial({
    color: 0xffff00,
    wireframe: true,
  })
);

const DEBUG = false;

const cameraManager = {
  perspectiveCamera,
  cameraHelper,
  debugCamera,
  orbitControls: null as OrbitControls | null,
  isPortrait: false,
  tween: null as gsap.core.Timeline | null,
  isTweening: false,
  positionOffset: {
    portrait: {
      x: DEBUG_PARAMS.camera.portrait.startscreen.x,
      y: DEBUG_PARAMS.camera.portrait.startscreen.y,
      z: DEBUG_PARAMS.camera.portrait.startscreen.z,
    },
    landscape: {
      x: DEBUG_PARAMS.camera.landscape.startscreen.x,
      y: DEBUG_PARAMS.camera.landscape.startscreen.y,
      z: DEBUG_PARAMS.camera.landscape.startscreen.z,
    },
    lerp: 1,
  },
  init({
    orbitControlDOMElement,
    scene,
  }: {
    orbitControlDOMElement: HTMLElement;
    scene: Scene;
  }) {
    // Will be overriden in update loop but needs to be explicitly set initially
    // otherwise camera controls won't work
    this.perspectiveCamera.position.z = 500;

    this.debugCamera.position.z = 500;
    this.orbitControls = new OrbitControls(
      this.debugCamera,
      orbitControlDOMElement
    );

    this.cameraHelper.visible =
      DEBUG_PARAMS.camera.cameraName === "debugCamera";

    scene.add(this.cameraHelper);

    if (DEBUG) {
      scene.add(DEBUG_FOCUS_AREA_MESH);
    }
  },
  focusOnPoint(position: Vector2Like) {
    const x = position.x + this.getCameraPosition("x");

    const y = MathUtils.lerp(
      cameraManager.perspectiveCamera.position.y,
      position.y + this.getCameraPosition("y"),
      this.positionOffset.lerp
    );

    let z = MathUtils.lerp(
      cameraManager.perspectiveCamera.position.z,
      this.getCameraPosition("z"),
      this.positionOffset.lerp
    );

    cameraManager.perspectiveCamera.position.set(x, y, z);
  },
  raycastPlayerTerrain(player: Player, terrainChunks: TerrainChunk[]) {
    // Feeding directly the flatten terrainChunk.bodies into the raycast algorithm gives
    // unexpected results. It seems to work flawlessly when feeding the flatten array of every bodies
    // individual parts.
    const terrainBodies = terrainChunks
      .map((tc) => tc.bodies)
      .flat()
      .map((b) => b.parts)
      .flat();

    const raycols = raycast(
      terrainBodies,
      {
        x: player.physicsBody.position.x,
        y: player.physicsBody.position.y + DEBUG_PARAMS.offset,
      },
      {
        x: player.physicsBody.position.x,
        y: player.physicsBody.position.y + 500 + DEBUG_PARAMS.offset,
      }
    );

    return raycols[0]?.point;
  },
  update(player: Player, terrainChunks: TerrainChunk[]) {
    this.isPortrait = innerWidth < innerHeight;
    this.isTweening =
      !this.tween ||
      (this.tween && (this.tween.isActive() || this.tween.progress() === 0));

    const point = this.raycastPlayerTerrain(player, terrainChunks);

    this.focusOnPoint({
      x: point ? point.x : player.object3D.position.x,
      y: point ? -point.y : player.object3D.position.y,
    });

    if (gameIsPlaying() && !this.isTweening && point) {
      this.fitPlayerAndTerrain(player, point);
    }

    TEMP_LOOKAT.set(
      cameraManager.perspectiveCamera.position.x,
      cameraManager.perspectiveCamera.position.y,
      0
    );
    cameraManager.perspectiveCamera.lookAt(TEMP_LOOKAT);
  },
  fitPlayerAndTerrain(player: Player, point: Vector) {
    // Compute the height between terrain bellow player and player
    const focusAreaHeight =
      player.object3D.position.y -
      -point.y +
      DEBUG_PARAMS.camera.focusAreaPadding.y;

    // Update the position and scale of the mesh representing the terrain/player gap
    DEBUG_FOCUS_AREA_MESH.position.set(
      point.x,
      -point.y +
        focusAreaHeight / 2 -
        DEBUG_PARAMS.camera.focusAreaPadding.y / 2,
      0
    );

    DEBUG_FOCUS_AREA_MESH.scale.set(50, focusAreaHeight, 1);

    // Compute the minimum camera z in order for the "player/terrain mesh" to be completly visible in
    // camera frustrum.
    // If this value is higher than current camera z, use new value.
    // https://wejn.org/2020/12/cracking-the-threejs-object-fitting-nut/
    TEMP_ZBOXFIT.setFromObject(DEBUG_FOCUS_AREA_MESH);

    TEMP_ZBOXFIT.getSize(TEMP_ZBOXSIZEFIT);

    const fov = this.perspectiveCamera.fov * (Math.PI / 180);

    const fovh =
      2 * Math.atan(Math.tan(fov / 2) * this.perspectiveCamera.aspect);

    let dx =
      TEMP_ZBOXSIZEFIT.z / 2 +
      Math.abs(TEMP_ZBOXSIZEFIT.x / 2 / Math.tan(fovh / 2));

    let dy =
      TEMP_ZBOXSIZEFIT.z / 2 +
      Math.abs(TEMP_ZBOXSIZEFIT.y / 2 / Math.tan(fov / 2));

    let newZ = Math.max(dx, dy);

    if (newZ > this.perspectiveCamera.position.z) {
      // No lerp, it feels snappier that way
      cameraManager.perspectiveCamera.position.z = newZ;
    }
  },
  getCameraPosition(axis: "x" | "y" | "z") {
    const mode = this.isPortrait ? "portrait" : "landscape";

    return this.positionOffset[mode][axis];
  },
  tweenCameraIntoPlay() {
    cameraManager.tween?.kill();
    const duration = 2;
    const ease = "power2.inOut";
    cameraManager.tween = gsap
      .timeline({
        onComplete: () => {
          this.positionOffset.lerp = DEBUG_PARAMS.camera.lerp;
        },
      })
      .to(
        this.positionOffset.portrait,
        {
          x: DEBUG_PARAMS.camera.portrait.playing.x,
          y: DEBUG_PARAMS.camera.portrait.playing.y,
          z: DEBUG_PARAMS.camera.portrait.playing.z,
          duration,
          ease,
        },
        0
      )
      .to(
        this.positionOffset.landscape,
        {
          x: DEBUG_PARAMS.camera.landscape.playing.x,
          y: DEBUG_PARAMS.camera.landscape.playing.y,
          z: DEBUG_PARAMS.camera.landscape.playing.z,
          duration,
          ease,
        },
        0
      )
      .to(
        this.positionOffset,
        {
          lerp: 1,
          ease: "linear",
        },
        0
      );
  },
  tweenCameraOutOfPlay() {
    cameraManager.tween?.kill();

    const duration = 6;
    const ease = "power2.inOut";

    cameraManager.tween = gsap
      .timeline({
        onComplete: () => {
          this.positionOffset.lerp = DEBUG_PARAMS.camera.lerp;
        },
      })
      .to(
        this.positionOffset.portrait,
        {
          x: DEBUG_PARAMS.camera.portrait.completed.x,
          y: DEBUG_PARAMS.camera.portrait.completed.y,
          z: DEBUG_PARAMS.camera.portrait.completed.z,
          duration,
          ease,
        },
        0
      )
      .to(
        this.positionOffset.landscape,
        {
          x: DEBUG_PARAMS.camera.landscape.completed.x,
          y: DEBUG_PARAMS.camera.landscape.completed.y,
          z: DEBUG_PARAMS.camera.landscape.completed.z,
          duration,
          ease,
        },
        0
      )
      .to(
        this.positionOffset,
        {
          lerp: 1,
          ease: "linear",
        },
        0
      );
  },
};

export { cameraManager };
