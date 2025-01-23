import gsap from "gsap";
import { formatTime } from "../utils/time";
import { emitter } from "./emitter";

type UIPillElName = "blue" | "red" | "green" | "yellow" | "purple" | "white";
const PILL_EL_ACTIVE_CLASS = "active";

const IN_GAME_UI_ANIMATE_IN_DELAY = 0.5; //s
const CONTROLS_MIN_TIME = 1; //s

const initPanelAnimations = (root: HTMLElement, clipRoot: boolean) => {
  const animateInTargets = root.querySelectorAll("[data-animate-in]");

  // EXIT
  const exitTL = gsap.timeline({
    paused: true,
  });

  exitTL.fromTo(
    [...animateInTargets].reverse(),
    {
      opacity: 1,
      y: 0,
    },
    {
      opacity: 0,
      y: 40,
      stagger: 0.05,
      duration: 0.5,
      ease: "power4.out",
    }
  );

  if (clipRoot) {
    exitTL.fromTo(
      root,
      {
        clipPath: "inset(0% 0% 0% 0%)",
      },
      {
        clipPath: "inset(50% 50% 50% 50%)",
        ease: "power4.out",
      },
      0.15
    );
  }

  // ENTRANCE
  const entranceTL = gsap.timeline({
    paused: true,
  });

  if (clipRoot) {
    entranceTL.fromTo(
      root,
      {
        clipPath: "inset(50% 50% 50% 50%)",
      },
      {
        clipPath: "inset(0% 0% 0% 0%)",
        ease: "power4.inOut",
        clearProps: true,
      }
    );
  }

  entranceTL.fromTo(
    animateInTargets,
    {
      opacity: 0,
      y: 40,
    },
    {
      opacity: 1,
      y: 0,
      stagger: 0.1,
      duration: 1.25,
      ease: "elastic.out(1,0.3)",
      clearProps: true,
    },
    clipRoot ? "-=0.25" : 0
  );

  return [entranceTL, exitTL];
};

const UI = {
  startScreen: {
    el: document.querySelector(".js-start-screen") as HTMLElement,
    entranceAnimation: null as gsap.core.Timeline | null,
    exitAnimation: null as gsap.core.Timeline | null,
    animateIn: () => {
      UI.startScreen.el.style.display = "flex";
      UI.startScreen.entranceAnimation?.play(0);
    },
    animateOut: () => {
      UI.startScreen.entranceAnimation?.kill();

      UI.startScreen.exitAnimation?.play(0).then(() => {
        UI.startScreen.el.style.display = "none";
      });
    },
  },
  controls: {
    active: false,
    timestamp: 0,
    el: document.querySelector(".js-ui-controls") as HTMLElement,
    entranceAnimation: null as gsap.core.Timeline | null,
    exitAnimation: null as gsap.core.Timeline | null,
    animateIn: () => {
      UI.controls.scheduledExitAnimation?.kill();
      UI.controls.active = true;
      UI.controls.timestamp = Date.now();
      UI.controls.el.style.display = "flex";
      UI.controls.entranceAnimation?.play(0);
    },
    animateOut: () => {
      UI.controls.active = false;

      UI.controls.entranceAnimation?.kill();

      UI.controls.exitAnimation?.play(0).then(() => {
        UI.controls.el.style.display = "none";
      });
    },
    scheduledExitAnimation: null as gsap.core.Tween | null,
  },
  endScreen: {
    el: document.querySelector(".js-end-screen") as HTMLElement,
    timerEl: document.querySelector(".js-end-screen-timer") as HTMLElement,
    entranceAnimation: null as gsap.core.Timeline | null,
    exitAnimation: null as gsap.core.Timeline | null,
    animateIn: () => {
      UI.endScreen.exitAnimation?.kill();
      UI.endScreen.el.style.display = "flex";
      UI.endScreen.entranceAnimation?.play(0);
    },
    animateOut: () => {
      UI.endScreen.entranceAnimation?.kill();
      UI.endScreen.exitAnimation?.play(0).then(() => {
        UI.endScreen.el.style.display = "none";
      });
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
    entranceAnimation: null as gsap.core.Timeline | null,
    exitAnimation: null as gsap.core.Timeline | null,
    animateIn: () => {
      UI.hud.el.style.display = "flex";
      UI.hud.entranceAnimation?.play(0);
    },
    animateOut: () => {
      UI.hud.exitAnimation?.play(0).then(() => {
        UI.hud.el.style.display = "none";
      });
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
      emitter.emit("ui_click");
    });

    const restartBtnEl = UI.endScreen.el.querySelector(
      ".js-restart-button"
    ) as HTMLElement;
    restartBtnEl.addEventListener("click", () => {
      emitter.emit("ui_restartGame");
      emitter.emit("ui_click");
    });

    const toggleAudioEl = document.querySelector(
      ".js-toggle-audio"
    ) as HTMLElement;
    toggleAudioEl.addEventListener("click", () => {
      emitter.emit("ui_toggleAudio");
    });

    emitter.on("onJumpButtonPressed", () => {
      if (UI.controls.active) {
        UI.controls.active = false;
        UI.controls.scheduledExitAnimation?.kill();

        if ((Date.now() - UI.controls.timestamp) / 1000 > CONTROLS_MIN_TIME) {
          UI.controls.animateOut();
        } else {
          UI.controls.scheduledExitAnimation = gsap.delayedCall(
            CONTROLS_MIN_TIME,
            UI.controls.animateOut
          );
        }
      }
    });

    const [startScreenEntranceTL, startScreenExitTL] = initPanelAnimations(
      UI.startScreen.el,
      true
    );
    this.startScreen.entranceAnimation = startScreenEntranceTL;
    this.startScreen.exitAnimation = startScreenExitTL;

    const [controlsEntranceAnimation, controlExitAnimation] =
      initPanelAnimations(UI.controls.el, true);
    this.controls.entranceAnimation = controlsEntranceAnimation;
    this.controls.exitAnimation = controlExitAnimation;

    const [hudEntranceAnimation, hudExitAnimation] = initPanelAnimations(
      UI.hud.el,
      false
    );
    this.hud.entranceAnimation = hudEntranceAnimation;
    this.hud.exitAnimation = hudExitAnimation;

    const [successEntranceAnimation, successExitAnimation] =
      initPanelAnimations(UI.endScreen.el, true);
    this.endScreen.entranceAnimation = successEntranceAnimation;
    this.endScreen.exitAnimation = successExitAnimation;

    this.startScreen.animateIn();
  },
};

export type { UIPillElName };
export { UI, IN_GAME_UI_ANIMATE_IN_DELAY };
