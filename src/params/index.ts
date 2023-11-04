const PARAMS = {
  chunks: {
    count: 20,
    angle: {
      min: 0,
      max: 30,
    },
    diagonal: {
      min: 100,
      max: 1000,
    },
    subdivisions: 30,
    noise: {
      amplitude: 75,
      frequency: 0.002,
    },
    thickness: 10,
  },
  camera: {
    offset: {
      x: 300,
      y: 0,
    },
  },
  player: {
    velocity: {
      x: 5,
      jump: -5,
    },
    width: 50,
    height: 25,
    chamfer: 5,
    friction: 0,
    startPosition: {
      x: 100,
      y: -100,
    },
  },
};

export { PARAMS };
