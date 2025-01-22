import gsap from "gsap";
import { formatTime } from "../utils/time";
import { emitter } from "./emitter";

type UIPillElName = "blue" | "red" | "green" | "yellow" | "purple" | "white";
const PILL_EL_ACTIVE_CLASS = "active";

const IN_GAME_UI_ANIMATE_IN_DELAY = 0.5; //s
const CONTROLS_MIN_TIME = 1; //s

const initPanelAnimations = (root: HTMLElement) => {
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

  // ENTRANCE
  const entranceTL = gsap.timeline({
    paused: true,
  });

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
    "-=0.25"
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
      UI.startScreen.entranceAnimation?.resume(0);
    },
    animateOut: () => {
      UI.startScreen.entranceAnimation?.kill();

      UI.startScreen.exitAnimation?.resume(0).then(() => {
        UI.startScreen.el.style.display = "none";
      });
    },
    initEntranceAnimation: () => {
      const TL = gsap.timeline({
        paused: true,
      });

      TL.fromTo(
        UI.startScreen.el,
        {
          clipPath: "inset(50% 50% 50% 50%)",
        },
        {
          clipPath: "inset(0% 0% 0% 0%)",
          ease: "power4.inOut",
          clearProps: true,
        }
      );

      const animateInTargets =
        UI.startScreen.el.querySelectorAll("[data-animate-in]");

      TL.fromTo(
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
        "-=0.25"
      );

      return TL;
    },
    initExitAnimation: () => {
      const TL = gsap.timeline({
        paused: true,
      });

      const animateInTargets = [
        ...UI.startScreen.el.querySelectorAll("[data-animate-in]"),
      ].reverse();

      TL.fromTo(
        animateInTargets,
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

      TL.fromTo(
        UI.startScreen.el,
        {
          clipPath: "inset(0% 0% 0% 0%)",
        },
        {
          clipPath: "inset(50% 50% 50% 50%)",
          ease: "power4.out",
        },
        0.15
      );

      return TL;
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
      UI.controls.entranceAnimation?.resume(0);
    },
    animateOut: () => {
      UI.controls.active = false;

      UI.controls.entranceAnimation?.kill();

      UI.controls.exitAnimation?.resume(0).then(() => {
        UI.controls.el.style.display = "none";
      });
    },
    scheduledExitAnimation: null as gsap.core.Tween | null,
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
      UI.startScreen.el
    );
    this.startScreen.entranceAnimation = startScreenEntranceTL;
    this.startScreen.exitAnimation = startScreenExitTL;

    const [controlsEntranceAnimation, controlExitAnimation] =
      initPanelAnimations(UI.controls.el);
    this.controls.entranceAnimation = controlsEntranceAnimation;
    this.controls.exitAnimation = controlExitAnimation;

    this.startScreen.animateIn();
    // this.startScreen.animateIn();
  },
};

export type { UIPillElName };
export { UI, IN_GAME_UI_ANIMATE_IN_DELAY };
