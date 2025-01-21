import { Color } from "three";

const DEBUG_PARAMS = {
  segments: {
    definition: 30,
    count: 6,
    angle: {
      min: 0,
      max: 0.6,
    },
    alternateAngleEveryNTHChunk: 4,
    length: {
      min: 300,
      max: 500,
    },
    physicalBodyOptions: {
      removeCollinear: 0.025,
      minimumArea: 10,
      removeDuplicatePoints: 0.01,
    },
  },
  player: {
    radius: 25,
    restitution: 0,
    friction: 0,
    frictionStatic: 0,
    autoRotateLerpAmount: 0.1,
    velocity: {
      x: 9,
      jump: -15,
    },
    groundSensor: {
      width: 25,
      height: 10,
    },
    variableJump: {
      maxTime: 280,
    },
    slowdown: {
      timeToMaxVel: 0.5, // s
      duration: 1, // s
    },
    landingAnimationMinVelocity: 14,
  },
  terrain: {
    restitution: 0,
    friction: 0,
    frictionAir: 0,
    frictionStatic: 0,
    model: {
      xScaleMultiplier: 2.46,
      positionYOffset: 5,
      scale: {
        y: -60,
        z: 100,
      },
    },
  },
  webgl: {
    enabled: true,
  },
  debugRenderer: {
    enabled: false,
  },
  physics: {
    enabled: true,
    gravity: {
      falling: 4,
      jumping: 1,
      grounded: 1,
    },
  },
  obstacles: {
    minPosition: 0.1,
    maxPosition: 0.9,
    size: {
      x: 40,
      y: 80,
      z: 25,
    },
    collider: {
      radius: 20,
    },
    // For chunks between min.chunkIndex and max.chunkIndex,
    // properties will be interpolated linearly.
    // Properties are clamped for chunks lower or higher.
    difficulty: {
      min: {
        chunkIndex: 1,
        count: {
          min: 0,
          max: 1,
        },
        minDistance: 0.1, // 0 = 0, 1 = 100% of the curve. 0.1 = 1/10th of the curve length
      },
      max: {
        chunkIndex: 10,
        count: {
          min: 0,
          max: 3,
        },
        minDistance: 0.1, // 0 = 0, 1 = 100% of the curve. 0.1 = 1/10th of the curve length
      },
    },
  },
  camera: {
    cameraName: "perspectiveCamera",
    followPlayer: true,
    portrait: {
      playing: {
        x: 109,
        y: 126,
        z: 800,
      },
      startscreen: {
        x: 0,
        y: -30,
        z: 100,
      },
      completed: {
        x: 0,
        y: -30,
        z: 100,
      },
    },
    landscape: {
      playing: {
        x: 65,
        y: 54,
        z: 300,
      },
      startscreen: {
        x: 0,
        y: 0,
        z: 100,
      },
      completed: {
        x: 0,
        y: 0,
        z: 100,
      },
    },
    lerp: 0.1,
    focusAreaPadding: {
      y: 250,
    },
  },
  colorMaskFX: {
    desaturation: 0.75,
    night: {
      color: 0x003481,
    },
  },
  background: {
    plane: {
      z: -1000,
      scrollSpeed: 0.0005,
    },
    islands: {
      scale: 250,
      yOffset: 300,
      z: -700,
    },
  },
  trailFX: {
    debug: false,
    thickness: 0.025,
    traveling: 0.1,
    banding: 0.03,
    playerFallFadeOutDuration: 1,
    playerSpeedBackUpFadeInDuration: 1,
  },
  pills: {
    scale: 125,
    physicsBodyRadius: 20,
    terrainOffset: -100,
    flares: {
      layers: [
        {
          step: 0.41,
          edges: 0.13,
          speed: 0.0001,
          scale: 1.1,
        },
        {
          step: 0.46,
          edges: 0.07,
          speed: 0.00009,
          scale: 1.52,
        },
        {
          step: 0.51,
          edges: 0.07,
          speed: 0.00022,
          scale: 2.39,
        },
      ],
      colors: [
        [
          new Color(0x2bc9a4).convertLinearToSRGB(),
          new Color(0x006978).convertLinearToSRGB(),
          new Color(0x003a3e).convertLinearToSRGB(),
        ],
        [
          new Color(0xff6a28).convertLinearToSRGB(),
          new Color(0xd9532b).convertLinearToSRGB(),
          new Color(0xc0462d).convertLinearToSRGB(),
        ],
        [
          new Color(0x1fa13e).convertLinearToSRGB(),
          new Color(0x008636).convertLinearToSRGB(),
          new Color(0x05d38).convertLinearToSRGB(),
        ],
        [
          new Color(0xf6d24e).convertLinearToSRGB(),
          new Color(0xcead30).convertLinearToSRGB(),
          new Color(0x9e9a3a).convertLinearToSRGB(),
        ],
        [
          new Color(0xafb3bc).convertLinearToSRGB(),
          new Color(0x8f92a2).convertLinearToSRGB(),
          new Color(0x565964).convertLinearToSRGB(),
        ],
        [
          new Color(0xefcca8).convertLinearToSRGB(),
          new Color(0xe4a889).convertLinearToSRGB(),
          new Color(0x90704b).convertLinearToSRGB(),
        ],
      ],
    },
  },
  particles: {
    sliding: {
      enabled: true,
      count: 1,
      speed: { min: 1, max: 14 },
      velocity: {
        x: {
          min: 0,
          max: 10,
        },
        y: {
          min: 0,
          max: 300,
        },
        z: {
          min: 0,
          max: 10,
        },
      },
      scale: {
        min: 1,
        max: 15,
      },
      lifetime: {
        min: 0.5,
        max: 1.5,
      },
      gravity: -500,
      colors: [
        new Color(0xff6f3a).convertLinearToSRGB(),
        new Color(0xa92a22).convertLinearToSRGB(),
        new Color(0xe13529).convertLinearToSRGB(),
        new Color(0xffc939).convertLinearToSRGB(),
        new Color(0xebbcb9).convertLinearToSRGB(),
        new Color(0xffe294).convertLinearToSRGB(),
      ],
    },
    landing: {
      enabled: true,
      minVelocityY: 14,
      count: 50,
      speed: { min: 1, max: 14 },
      velocity: {
        x: {
          min: -500,
          max: 500,
        },
        y: {
          min: 0,
          max: 350,
        },
        z: {
          min: -250,
          max: 250,
        },
      },
      scale: {
        min: 1,
        max: 10,
      },
      lifetime: {
        min: 0.5,
        max: 1.5,
      },
      gravity: -1000,
      colors: [
        new Color(0xff6f3a).convertLinearToSRGB(),
        new Color(0xa92a22).convertLinearToSRGB(),
        new Color(0xe13529).convertLinearToSRGB(),
        new Color(0xffc939).convertLinearToSRGB(),
        new Color(0xebbcb9).convertLinearToSRGB(),
        new Color(0xffe294).convertLinearToSRGB(),
      ],
    },
    obstacle: {
      enabled: true,
      count: 50,
      speed: { min: 1, max: 14 },
      velocity: {
        x: {
          min: -500,
          max: 500,
        },
        y: {
          min: 0,
          max: 350,
        },
        z: {
          min: -250,
          max: 250,
        },
      },
      scale: {
        min: 1,
        max: 10,
      },
      lifetime: {
        min: 0.5,
        max: 1.5,
      },
      gravity: -1000,
      colors: [
        new Color(0x4a4d54).convertLinearToSRGB(),
        new Color(0x6a6f80).convertLinearToSRGB(),
        new Color(0xaaaeb8).convertLinearToSRGB(),
      ],
    },
    pill: {
      count: 500,
      velocity: {
        x: 500,
        y: 500,
        z: 500,
      },
      acceleration: {
        x: 500,
        y: 500,
        z: 500,
      },
      lifetime: {
        min: 0,
        max: 2,
      },
      scale: {
        min: 1,
        max: 5,
      },
    },
  },
  offset: 0,
  floatingElements: {
    backgroundIslands: {
      scale: {
        min: 230,
        max: 300,
      },
      rotation: {
        min: 0,
        max: 0,
      },
      offset: {
        x: 0,
        y: {
          min: 200,
          max: 200,
        },
        z: {
          min: -700,
          max: -700,
        },
      },
    },
    foregroundCloudsBig: {
      scale: {
        min: 200,
        max: 200,
      },
      rotation: {
        min: 0,
        max: 0,
      },
      offset: {
        x: 0,
        y: {
          min: -300,
          max: -300,
        },
        z: {
          min: -200,
          max: -200,
        },
      },
    },
    foregroundCloudsSmall: {
      scale: {
        min: 25,
        max: 80,
      },
      rotation: {
        min: 0,
        max: 0,
      },
      offset: {
        x: 0,
        y: {
          min: -150,
          max: -150,
        },
        z: {
          min: -100,
          max: -100,
        },
      },
    },
  },
};

export { DEBUG_PARAMS };
