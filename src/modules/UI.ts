import { emitter } from "./emitter";

const UI = {
  startScreen: {
    el: document.querySelector(".js-start-screen") as HTMLElement,
    animateIn: () => {
      UI.startScreen.el.style.display = "block";
    },
    animateOut: () => {
      UI.startScreen.el.style.display = "none";
    },
  },
  endScreen: {
    el: document.querySelector(".js-end-screen") as HTMLElement,
    animateIn: () => {
      UI.endScreen.el.style.display = "block";
    },
    animateOut: () => {
      UI.endScreen.el.style.display = "none";
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

export { UI };
