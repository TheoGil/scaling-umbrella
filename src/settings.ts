const DEBUG_PARAMS = {
  p: 0,
  segments: {
    definition: 100,
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
    velocity: {
      x: 10,
      jump: -10,
    },
    groundSensor: {
      width: 25,
      height: 10,
    },
  },
};

export { DEBUG_PARAMS };
