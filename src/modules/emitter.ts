import type { Engine, IEventCollision } from "matter-js";
import mitt from "mitt";

const emitter = mitt<{
  onCollisionStart: IEventCollision<Engine>;
  onCollisionEnd: IEventCollision<Engine>;
  onPlayerCollisionWithObstacle: number;
  onPlayerCollisionWithPill?: null;
  onGameComplete?: null;
  onPlayerSpeedBackUp?: null;
  onJumpButtonPressed?: null;
  onJumpButtonReleased?: null;
  onPillLeaveFrustum?: null;
}>();

export { emitter };
