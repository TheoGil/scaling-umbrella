import type { Engine, IEventCollision } from "matter-js";
import mitt from "mitt";
import { Particle } from "./particle-emitter";

const emitter = mitt<{
  onCollisionStart: IEventCollision<Engine>;
  onCollisionEnd: IEventCollision<Engine>;
  game_playerObstacleCollision: number;
  game_playerPillCollision?: null;
  onPlayerSpeedBackUp?: null;
  onJumpButtonPressed?: null;
  onJumpButtonReleased?: null;
  onPillLeaveFrustum?: null;
  onSpawnParticle: Particle;
  ui_startGame?: null;
  ui_restartGame?: null;
  ui_click?: null;
  ui_toggleAudio?: null;
  game_playerLeaveGround?: null;
  game_playerGroundBack?: null;
  game_playerJump?: null;
  game_playerBounce?: null;
  game_complete?: null;
}>();

export { emitter };
