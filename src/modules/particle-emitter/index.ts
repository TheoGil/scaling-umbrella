import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  Material,
  Mesh,
  Object3D,
  PlaneGeometry,
  Points,
  ShaderMaterial,
  Texture,
  Uniform,
  Vector3,
} from "three";

import billboardFragmentShader from "./glsl/particleEmitter-billboard.frag.glsl";
import billboardVertexShader from "./glsl/particleEmitter-billboard.vert.glsl";
// import defaultFragmentShader from './glsl/particleEmitter-default.frag.glsl'
// import defaultVertexShader from './glsl/particleEmitter-default.vert.glsl'
// import extendedMaterialFragmentShader from './glsl/particleEmitter-extendedMaterial.frag.glsl'
// import extendedMaterialVertexShader from './glsl/particleEmitter-extendedMaterial.vert.glsl'
import { wrap } from "./utils";

import type {
  ParticleEmitterOptions,
  ParticleEmitterRenderMode,
} from "./types";

const defaultGeometry = new PlaneGeometry(1, 1, 1, 1);

const formatError = (error: string) => `EPIC Particle Emitter - ${error}`;

export class ParticleEmitter extends Object3D {
  renderMode: ParticleEmitterRenderMode;
  particlesCount: number;
  geometry?: InstancedBufferGeometry | BufferGeometry;
  material?: ShaderMaterial;
  // TODO: Proper typing mesh is Points if renderMode === 'billboard', is Mesh if renderMode === 'mesh'
  mesh?: Mesh | Points;
  // TODO: Proper typing sourceGeometry option is ignored if renderMode === 'billboard', required if renderMode === 'mesh'
  sourceGeometry?: BufferGeometry;
  sourceMaterial?: Material;

  // The current particle instance index.
  particleCursor = 0;

  // Internal clock.
  time = 0;

  texture?: Texture;

  bufferAttributeOffset = 0;
  bufferAttributeCount = 0;

  constructor(options: ParticleEmitterOptions) {
    super();

    this.renderMode = options.renderMode ?? "billboard";
    this.sourceGeometry = options.geometry ?? defaultGeometry;
    this.sourceMaterial = options.material ?? undefined;
    this.particlesCount = options.particlesCount ?? 1000;
    this.texture = options.texture ?? undefined;

    this.initGeometry();
    this.initMaterial();
    this.initMesh();
  }

  /**
   * Helper function that sets a neww attribute on the geometry.
   * Depending on render mode, it will create an InstancedBufferAttribute (mesh) or a BufferAttribute (billboard).
   */
  private setGeometryAttribute(name: string, itemSize: number) {
    if (!this.geometry) {
      throw new Error(
        formatError(`Cannot set attribute ${name}, geometry does not exist.`)
      );
    }

    const typedArray = new Float32Array(this.particlesCount * itemSize);

    const attribute =
      this.renderMode === "mesh"
        ? new InstancedBufferAttribute(typedArray, itemSize)
        : new BufferAttribute(typedArray, itemSize);

    this.geometry.setAttribute(name, attribute);
  }

  private initGeometry() {
    this.geometry = new BufferGeometry();

    // FIXME: This is required for the billboard render mode to work even if this attribute is not used at all. Why ?
    // I'm guessing that it might be required by some internal ThreeJS logic...
    if (
      this.renderMode === "billboard" &&
      !this.geometry.hasAttribute("position")
    ) {
      this.setGeometryAttribute("position", 3);
    }

    // NOTE: To minimize CPU to GPU calls, those 4 attributes could be defined using only 2 vector4 attributes.
    // This would increase code readability a little bit but improve performance.
    this.setGeometryAttribute("aTranslate", 3);
    this.setGeometryAttribute("aVelocity", 3);
    this.setGeometryAttribute("aAcceleration", 3);
    this.setGeometryAttribute("aStartTime", 1);
    this.setGeometryAttribute("aLifetime", 1);
    this.setGeometryAttribute("aSizeStart", 1);
    this.setGeometryAttribute("aScaleEnd", 1);
    this.setGeometryAttribute("aColorStart", 3);
    this.setGeometryAttribute("aColorEnd", 3);
    this.setGeometryAttribute("aRotation", 3);
    this.setGeometryAttribute("aRotationVelocity", 3);
  }

  private initMaterial() {
    const uniforms = {
      uTime: new Uniform(0),
      uFadeIn: new Uniform(0.5),
      uFadeOut: new Uniform(0.5),
      uTexture: new Uniform(this.texture),
      uAlpha: new Uniform(1),
    };

    // Using billboard render mode with a custom ShaderMaterial
    this.material = new ShaderMaterial({
      vertexShader: billboardVertexShader,
      fragmentShader: billboardFragmentShader,
      uniforms,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });

    this.initMaterialDefines();
  }

  private initMaterialDefines() {
    if (!this.material) {
      throw new Error(
        formatError(`Cannot set defines property, material does not exist.`)
      );
    }

    const defines: { EPE_USE_TEXTURE?: true } = {};

    if (this.texture) {
      defines.EPE_USE_TEXTURE = true;
    }

    this.material.defines = defines;
  }

  private initMesh() {
    if (this.renderMode === "mesh") {
      this.mesh = new Mesh(this.geometry, this.material);
    } else {
      this.mesh = new Points(this.geometry, this.material);
      this.mesh.frustumCulled = false;
    }

    this.add(this.mesh);
  }

  /**
   * Upon every particle spawn, let the geometry know that the values of every custom attributes
   * for specific instance need to be updated.
   */
  private geometryUpdate() {
    if (!this.geometry) {
      return;
    }

    [
      "aTranslate",
      "aVelocity",
      "aAcceleration",
      "aLifetime",
      "aStartTime",
      "aSizeStart",
      "aColorStart",
      "aColorEnd",
      "aRotation",
      "aRotationVelocity",
      "aScaleEnd",
    ].forEach((name) => {
      const bufferAttribute = this.geometry!.getAttribute(
        name
      ) as BufferAttribute;

      // Check if we can keep on incrementing the cursor position or if we need to go back to start position.
      const loop =
        this.bufferAttributeOffset + this.bufferAttributeCount >=
        this.particlesCount;

      // Compute the attribute updateRange's offset. This is the index at which we'll flag the values as "need to be updated".
      const offset = loop
        ? 0
        : this.bufferAttributeOffset * bufferAttribute.itemSize;

      // Compute the attribute updateRange's range. This is the amount of entries (starting from the offset) that we'll flag as "need to be updated".
      const count = loop
        ? -1
        : this.bufferAttributeCount * bufferAttribute.itemSize;

      // https://github.com/mrdoob/three.js/wiki/Migration-Guide#r158--r159
      bufferAttribute.updateRanges = [
        {
          start: offset,
          count: count,
        },
      ];

      // Let ThreeJS knows that some of the values in the buffer attribute need to be updated.
      bufferAttribute.needsUpdate = true;
    });
  }

  public update(time: number) {
    this.time = time;

    if (this.material) {
      this.material.uniforms.uTime.value = this.time;
    }
  }

  public spawnParticle({
    position,
    velocity,
    acceleration,
    lifetime,
    scaleStart,
    scaleEnd,
    colorStart,
    colorEnd,
    rotation,
    rotationVelocity,
  }: {
    position: Vector3;
    velocity: Vector3;
    acceleration: Vector3;
    lifetime: number;
    scaleStart: number;
    scaleEnd: number;
    colorStart: Color;
    colorEnd: Color;
    rotation: Vector3;
    rotationVelocity: Vector3;
  }) {
    if (this.geometry) {
      const i = this.particleCursor;

      this.geometry
        .getAttribute("aTranslate")
        .setXYZ(i, position.x, position.y, position.z);

      this.geometry
        .getAttribute("aVelocity")
        .setXYZ(i, velocity.x, velocity.y, velocity.z);

      this.geometry
        .getAttribute("aAcceleration")
        .setXYZ(i, acceleration.x, acceleration.y, acceleration.z);

      this.geometry.getAttribute("aLifetime").setX(i, lifetime);

      this.geometry.getAttribute("aStartTime").setX(i, this.time);

      this.geometry.getAttribute("aSizeStart").setX(i, scaleStart);

      this.geometry.getAttribute("aScaleEnd").setX(i, scaleEnd);

      this.geometry
        .getAttribute("aColorStart")
        .setXYZ(i, colorStart.r, colorStart.g, colorStart.b);

      this.geometry
        .getAttribute("aColorEnd")
        .setXYZ(i, colorEnd.r, colorEnd.g, colorEnd.b);

      this.geometry
        .getAttribute("aRotation")
        .setXYZ(i, rotation.x, rotation.y, rotation.z);

      this.geometry
        .getAttribute("aRotationVelocity")
        .setXYZ(i, rotationVelocity.x, rotationVelocity.y, rotationVelocity.z);
    }

    this.bufferAttributeOffset =
      this.bufferAttributeOffset === 0
        ? this.particleCursor
        : this.bufferAttributeOffset;

    this.particleCursor = wrap(this.particleCursor + 1, 0, this.particlesCount);

    this.bufferAttributeCount = this.bufferAttributeCount;

    this.geometryUpdate();
  }
}
