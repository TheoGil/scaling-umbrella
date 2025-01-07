import { TextureLoader, Texture } from "three";

import { GLTFLoader, GLTF } from "three/addons/loaders/GLTFLoader.js";
import { deferred } from "../utils/async";

type Asset = Texture | GLTF;

export interface AssetDefinition {
  id: string;
  src: string;
  type: "texture" | "gltf";
  onLoaded?: (asset: Texture | GLTF) => void;
}

const onLoadProgress = (xhr: { loaded: number; total: number }) => {
  console.info(
    `[AssetsManager:onLoadProgress] ${(xhr.loaded / xhr.total) * 100}% loaded`
  );
};

const onLoadError = (e: unknown) => {
  console.error("[AssetsManager:onLoadError]", e);
};

export class AssetsManager {
  private textureLoader: TextureLoader;
  private GLTFLoader: GLTFLoader;
  private assets: Map<string, Asset>;
  private loadQueue: AssetDefinition[];
  private isAlive = true;

  constructor() {
    this.textureLoader = new TextureLoader();
    this.GLTFLoader = new GLTFLoader();

    this.assets = new Map();
    this.loadQueue = [];
  }

  set(id: string, value: Asset) {
    this.assets.set(id, value);
  }

  get<T>(id: string) {
    const asset = this.assets.get(id);

    if (!asset) {
      throw new Error(`[AssetsManager:get] Asset ${id} not found`);
    }

    return this.assets.get(id) as T;
  }

  add(assetToLoad: AssetDefinition) {
    this.loadQueue.push(assetToLoad);
  }

  load(def: AssetDefinition) {
    let loader: TextureLoader | GLTFLoader | null = null;

    // Pick the right loader
    switch (def.type) {
      case "texture":
        loader = this.textureLoader;
        break;
      case "gltf":
        loader = this.GLTFLoader;
        break;
      default:
    }

    // Deferred promise (for readability)
    const p = deferred<void>();

    if (loader) {
      const { id, src, onLoaded } = def;

      loader.load(
        src,
        (asset) => {
          this.set(id, asset);
          onLoaded && onLoaded(asset);
          p.resolve();
        },
        onLoadProgress,
        onLoadError
      );
    } else {
      p.reject(`[AssetsManager:load] Unknown asset type ${def.type}`);
    }

    return p;
  }

  loadAll() {
    if (!this.isAlive) {
      logger.warn("[AssetsManager:loadAll] Instance has been destroyed");

      return;
    }

    const queue = [...this.loadQueue];
    this.loadQueue = [];

    return Promise.allSettled(queue.map((asset) => this.load(asset)));
  }

  destroy() {
    // Remove unneeded web worker
    this.DRACOLoader.dispose();
    this.isAlive = false;
  }
}
