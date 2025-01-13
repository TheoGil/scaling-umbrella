import { Color } from "three";

const DEBUG_PARAMS = {
  segments: {
    definition: 50,
    count: 10,
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
    ties: {
      width: 10,
      height: 5,
      depth: 50,
      color: 0x5b3b30,
    },
    profiles: {
      depth: 40,
      color: 0x62656d,
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
        minDistance: 0.25, // 0 = 0, 1 = 100% of the curve. 0.1 = 1/10th of the curve length
      },
      max: {
        chunkIndex: 10,
        count: {
          min: 1,
          max: 10,
        },
        minDistance: 0.025, // 0 = 0, 1 = 100% of the curve. 0.1 = 1/10th of the curve length
      },
    },
  },
  camera: {
    cameraName: "camera",
    followPlayer: true,
    portrait: {
      z: 800,
      offset: {
        x: 109,
        y: 126,
      },
    },
    landscape: {
      z: 300,
      offset: {
        x: 65,
        y: 54,
      },
    },
    yLerp: 0.1,
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
    physicsBodyRadius: 17,
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
    },
  },
};

export { DEBUG_PARAMS };
