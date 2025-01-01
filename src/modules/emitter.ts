import type { Engine, IEventCollision } from "matter-js";
import mitt from "mitt";

const emitter = mitt<{
  onCollisionStart: IEventCollision<Engine>;
  onCollisionEnd: IEventCollision<Engine>;
}>();

export { emitter };
