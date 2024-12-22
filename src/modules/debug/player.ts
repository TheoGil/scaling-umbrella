import { FolderApi } from "tweakpane";
import { App } from "../App";
import { SETTINGS } from "../../settings";

const initPlayerDebug = (pane: FolderApi, _app: App) => {
  const rootFolder = pane.addFolder({
    title: "Player",
    expanded: false,
  });

  rootFolder.addBinding(SETTINGS.player.velocity, "x", {
    min: 0,
    max: 20,
    label: "Vel X",
  });

  rootFolder.addBinding(SETTINGS.player, "backFlipRotationSpeed", {
    min: 0,
    max: 1,
    label: "Backflip",
  });
};

export { initPlayerDebug };
