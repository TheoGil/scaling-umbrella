import { DRACOLoader, GLTFLoader } from "three/examples/jsm/Addons.js";
import littlestTokyoUrl from "/LittlestTokyo.glb?url";
import {
  BufferGeometry,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
} from "three";

export class TestColorMask {
  object3D = new Object3D();

  constructor() {
    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("/scaling-umbrella/draco/");
    loader.setDRACOLoader(dracoLoader);

    loader.load(littlestTokyoUrl, (gltf) => {
      // On récupère la texture en la ciblant sur un élément identifié au préalable
      const map = (
        gltf.scene.getObjectByName("Object078_Plastic_Soft_0") as Mesh<
          BufferGeometry,
          MeshStandardMaterial
        >
      ).material.map;

      // Nouveau matériel utilisant cette texture qui n'a pas besoin de lumière
      const material = new MeshBasicMaterial({
        map,
      });

      // Traverse la scène et remplace le matériel de tous les mesh par le notre
      gltf.scene.traverse((object) => {
        if (object.type === "Mesh") {
          const mesh = object as Mesh;
          mesh.material = material;
        }
      });

      this.object3D.add(gltf.scene);
    });
  }
}
