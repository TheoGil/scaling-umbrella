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
  },
  terrain: {
    restitution: 0,
    friction: 0,
    frictionAir: 0,
    frictionStatic: 0,
    gaps: { min: 0, max: 0 },
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
      falling: 4.5,
      jumping: 1,
      grounded: 1,
    },
  },
  obstacles: {
    minPosition: 0.1,
    maxPosition: 0.9,
    size: {
      x: 40,
      y: 25,
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
    thickness: 0.025,
    traveling: 0.1,
    debug: false,
    banding: 0.03,
  },
  pills: {
    scale: 100,
    physicsBodyRadius: 15,
    terrainOffset: -100,
  },
};

export { DEBUG_PARAMS };
