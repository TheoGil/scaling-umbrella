import type { BufferGeometry, Material, Texture } from 'three'
import type { MaterialConstructor } from 'three-custom-shader-material'

export type ParticleEmitterRenderMode = 'billboard' | 'mesh'

export interface ParticleEmitterOptions {
  renderMode?: ParticleEmitterRenderMode
  geometry?: BufferGeometry
  material?: Material | MaterialConstructor
  particlesCount?: nunmber
  texture?: Texture
}
