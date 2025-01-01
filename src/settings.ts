const DEBUG_PARAMS = {
  segments: {
    definition: 50,
    count: 10,
    angle: {
      min: 0,
      max: 0.6,
    },
    alternateAngle: true,
    length: {
      min: 300,
      max: 500,
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
      jump: -10,
    },
    groundSensor: {
      width: 25,
      height: 10,
    },
    terrainAngleSensor: {
      width: 2,
      height: 100,
    },
  },
  terrain: {
    restitution: 0,
    friction: 0,
    frictionAir: 0,
    frictionStatic: 0,
    gaps: { min: 400, max: 500 },
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
  },
};

export { DEBUG_PARAMS };
