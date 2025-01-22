import { formatTime } from "../utils/time";
import { emitter } from "./emitter";

type UIPillElName = "blue" | "red" | "green" | "yellow" | "purple" | "white";
const PILL_EL_ACTIVE_CLASS = "active";

const UI = {
  startScreen: {
    el: document.querySelector(".js-start-screen") as HTMLElement,
    animateIn: () => {
      UI.startScreen.el.style.display = "flex";
    },
    animateOut: () => {
      UI.startScreen.el.style.display = "none";
    },
  },
  endScreen: {
    el: document.querySelector(".js-end-screen") as HTMLElement,
    timerEl: document.querySelector(".js-end-screen-timer") as HTMLElement,
    animateIn: () => {
      UI.endScreen.el.style.display = "block";
    },
    animateOut: () => {
      UI.endScreen.el.style.display = "none";
    },
    updateTimer(time: number) {
      UI.endScreen.timerEl.innerText = formatTime(time);
    },
  },
  hud: {
    el: document.querySelector(".js-hud") as HTMLElement,
    timerEl: document.querySelector(".js-time") as HTMLElement,
    pills: {
      blue: document.querySelector(".js-pill-blue") as HTMLElement,
      red: document.querySelector(".js-pill-red") as HTMLElement,
      green: document.querySelector(".js-pill-green") as HTMLElement,
      yellow: document.querySelector(".js-pill-yellow") as HTMLElement,
      purple: document.querySelector(".js-pill-purple") as HTMLElement,
      white: document.querySelector(".js-pill-white") as HTMLElement,
    },
    animateIn: () => {
      UI.hud.el.style.display = "flex";
    },
    animateOut: () => {
      UI.hud.el.style.display = "none";
    },
    updateTimer(time: number) {
      UI.hud.timerEl.innerText = formatTime(time);
    },
    setPillState(pill: UIPillElName, state: boolean) {
      if (state) {
        UI.hud.pills[pill].classList.add(PILL_EL_ACTIVE_CLASS);
      } else {
        UI.hud.pills[pill].classList.remove(PILL_EL_ACTIVE_CLASS);
      }
    },
  },
  init() {
    const startBtnEl = UI.startScreen.el.querySelector(
      ".js-start-button"
    ) as HTMLElement;
    startBtnEl.addEventListener("click", () => {
      emitter.emit("ui_startGame");
    });

    const restartBtnEl = UI.endScreen.el.querySelector(
      ".js-restart-button"
    ) as HTMLElement;
    restartBtnEl.addEventListener("click", () => {
      emitter.emit("ui_restartGame");
    });

    this.startScreen.animateIn();
  },
};

export type { UIPillElName };
export { UI };
