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
  focusOnPoint(position: Vector2Like, lerpAmount = DEBUG_PARAMS.camera.lerp) {
    // Set the camera position so that if follows the player object3D (using an offset defined in settings)
    const isPortrait = innerWidth < innerHeight;

    const portraitOffset = DEBUG_PARAMS.camera.portrait.offset;
    const landscapeOffset = DEBUG_PARAMS.camera.landscape.offset;

    const offsetX = isPortrait ? portraitOffset.x : landscapeOffset.x;

    const offsetY = isPortrait ? portraitOffset.y : landscapeOffset.y;

    const x = position.x + offsetX;

    const y = MathUtils.lerp(
      cameraManager.perspectiveCamera.position.y,
      position.y + offsetY,
      lerpAmount
    );

    let z = MathUtils.lerp(
      cameraManager.perspectiveCamera.position.z,
      isPortrait ? portraitOffset.z : landscapeOffset.z,
      lerpAmount
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
    const point = this.raycastPlayerTerrain(player, terrainChunks);

    this.focusOnPoint({
      x: point ? point.x : player.object3D.position.x,
      y: point ? -point.y : player.object3D.position.y,
    });

    if (point) {
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
};

export { cameraManager };
