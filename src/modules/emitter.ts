import type { Engine, IEventCollision } from "matter-js";
import mitt from "mitt";
import { Particle } from "./particle-emitter";

const emitter = mitt<{
  onCollisionStart: IEventCollision<Engine>;
  onCollisionEnd: IEventCollision<Engine>;
  onPlayerCollisionWithObstacle: number;
  onPlayerCollisionWithPill?: null;
  onGameComplete?: null;
  onPlayerSpeedBackUp?: null;
  onSpawnParticle: Particle;
}>();

export { emitter };
