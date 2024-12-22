import { FolderApi } from "tweakpane";
import { App } from "../App";

const initPhysicsEngineDebug = (pane: FolderApi, app: App) => {
  const rootFolder = pane.addFolder({
    title: "Physics engine",
    expanded: false,
  });

  rootFolder.addBinding(app.runner, "enabled");

  rootFolder.addBinding(app.physicsEngine.timing, "timeScale", {
    min: 0,
    max: 1,
  });
};

export { initPhysicsEngineDebug };
