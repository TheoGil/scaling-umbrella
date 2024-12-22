import { Pane } from "tweakpane";
import { initTerrainDebug } from "./terrain";
import { App } from "../App";
import { initPhysicsEngineDebug } from "./physics";
import { initPlayerDebug } from "./player";

const initDebug = (app: App) => {
  const pane = new Pane();

  initPhysicsEngineDebug(pane, app);
  initPlayerDebug(pane, app);
  initTerrainDebug(pane, app);
};

export { initDebug };
