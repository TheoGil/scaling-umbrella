import {
  Mesh,
  ShaderMaterial,
  Object3D,
  PlaneGeometry,
  MeshBasicMaterial,
  Texture,
  WebGLRenderer,
  Uniform,
  Vector2,
  Scene,
  WebGLRenderTarget,
  ClampToEdgeWrapping,
  LinearFilter,
  RGBAFormat,
  FloatType,
  OrthographicCamera,
  RepeatWrapping,
  Clock,
  PerspectiveCamera,
  Vector2Like,
  Vector3,
} from "three";

import trailVertex from "../glsl/trail.vertex.glsl?raw";
import trailFragment from "../glsl/trail.fragment.glsl?raw";
import { DEBUG_PARAMS } from "../settings";
import { getCameraFrustrumDimensionsAtDepth } from "../utils/getCameraFrustrumDimensionsAtDepth";

const dummyVec3 = new Vector3();

class BufferSim {
  renderer: WebGLRenderer;
  shader: ShaderMaterial;
  orthoScene: Scene;
  fbos: [WebGLRenderTarget, WebGLRenderTarget];
  current: number;
  output: WebGLRenderTarget;
  orthoCamera: OrthographicCamera;
  orthoQuad: Mesh;
  input?: WebGLRenderTarget;

  constructor(
    renderer: WebGLRenderer,
    width: number,
    height: number,
    shader: ShaderMaterial
  ) {
    this.renderer = renderer;
    this.shader = shader;
    this.orthoScene = new Scene();
    var fbo = new WebGLRenderTarget(width, height, {
      wrapS: ClampToEdgeWrapping,
      wrapT: ClampToEdgeWrapping,
      minFilter: LinearFilter,
      magFilter: LinearFilter,
      format: RGBAFormat,
      type: FloatType,
      stencilBuffer: false,
      depthBuffer: false,
    });

    fbo.texture.generateMipmaps = false;

    this.fbos = [fbo, fbo.clone()];
    this.current = 0;
    this.output = this.fbos[0];
    this.orthoCamera = new OrthographicCamera(
      width / -2,
      width / 2,
      height / 2,
      height / -2,
      0.00001,
      1000
    );
    this.orthoQuad = new Mesh(new PlaneGeometry(width, height), this.shader);
    this.orthoScene.add(this.orthoQuad);
  }

  render() {
    this.shader.uniforms.uInputTexture.value = this.fbos[this.current].texture;
    this.input = this.fbos[this.current];
    this.current = 1 - this.current;
    this.output = this.fbos[this.current];
    this.renderer.setRenderTarget(this.output);
    this.renderer.render(this.orthoScene, this.orthoCamera);
    this.renderer.setRenderTarget(null);
  }
}

class Trail {
  object3D: Mesh<PlaneGeometry, MeshBasicMaterial>;
  desiredTrailOrigin = new Vector2();
  previousTrailOrigin = new Vector2();
  trailOrigin = new Vector2();
  thickness = DEBUG_PARAMS.trailFX.thickness;
  traveling = DEBUG_PARAMS.trailFX.traveling;
  floorSimMat: ShaderMaterial;
  bufferSim: BufferSim;
  renderer: WebGLRenderer;
  camera: PerspectiveCamera;
  clock: Clock;

  constructor(
    renderer: WebGLRenderer,
    noiseTexture: Texture,
    camera: PerspectiveCamera
  ) {
    noiseTexture.wrapS = RepeatWrapping;
    noiseTexture.wrapT = RepeatWrapping;

    this.camera = camera;
    this.renderer = renderer;
    this.clock = new Clock();

    this.desiredTrailOrigin;
    this.previousTrailOrigin;

    this.floorSimMat = new ShaderMaterial({
      uniforms: {
        uInputTexture: new Uniform(null),
        uNoiseTexture: new Uniform(noiseTexture),
        uThickness: new Uniform(this.thickness),
        uTraveling: new Uniform(this.traveling),
        uTime: new Uniform(0),
        uTipPosOld: new Uniform(new Vector2()),
        uTipPosNew: new Uniform(new Vector2()),
        uSpeed: new Uniform(0),
        uMovement: new Uniform(new Vector2()),
      },
      vertexShader: trailVertex,
      fragmentShader: trailFragment,
    });

    this.bufferSim = new BufferSim(renderer, 512, 512, this.floorSimMat);

    // Only useful for visual debuging purposes
    this.object3D = new Mesh(
      new PlaneGeometry(),
      new MeshBasicMaterial({
        map: this.bufferSim.output.texture,
        visible: DEBUG_PARAMS.trailFX.debug,
      })
    );
  }

  update({ origin, movement }: { origin: Vector2Like; movement: Vector2Like }) {
    const delta = this.clock.getDelta();

    // Convert origin (player world position) to screen space
    dummyVec3.set(origin.x, origin.y, 0);
    dummyVec3.project(this.camera);
    this.desiredTrailOrigin.set((dummyVec3.x + 1) / 2, (dummyVec3.y + 1) / 2);

    this.trailOrigin.lerp(this.desiredTrailOrigin, delta * 5);

    this.floorSimMat.uniforms.uTipPosNew.value = this.trailOrigin;
    this.floorSimMat.uniforms.uTipPosOld.value = this.previousTrailOrigin;
    this.floorSimMat.uniforms.uTime.value = this.clock.elapsedTime;
    this.floorSimMat.uniforms.uTraveling.value = this.traveling * delta;
    this.floorSimMat.uniforms.uMovement.value.copy(movement);

    this.bufferSim.render();
    this.renderer.setRenderTarget(null);

    this.object3D.material.map = this.bufferSim.output.texture;

    this.previousTrailOrigin.copy(this.trailOrigin);

    // Scale and move debug plane so that it covers whole viewport.
    // Only useful for visual debuging purposes.
    if (DEBUG_PARAMS.trailFX.debug) {
      const { width, height } = getCameraFrustrumDimensionsAtDepth(
        this.camera,
        0
      );
      this.object3D.scale.set(width, height, 1);
      this.object3D.position.set(
        this.camera.position.x,
        this.camera.position.y,
        0
      );
    }
  }
}

export { Trail };