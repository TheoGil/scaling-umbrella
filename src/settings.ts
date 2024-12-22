const SETTINGS = {
  terrain: {
    chunks: {
      diagonal: {
        length: {
          min: 200,
          max: 500,
        },
        angle: {
          min: 20,
          max: 30,
        },
      },
      divisions: 5,
      noise: {
        freq: 0.002,
        amp: 50,
      },
      thickness: 10,
    },
  },
  player: {
    startPosition: {
      x: 250,
      y: 100,
    },
    width: 50,
    height: 25,
    chamfer: 12.5,
    friction: 0,
    groundSensorThickness: 5,
    terrainAngleSensor: {
      width: 5,
      height: 200,
    },
    autoRotateLerpAmount: 0.1,
    backFlipRotationSpeed: 0.25,
    velocity: {
      x: 7.5,
      jump: -10,
    },
  },
  debug: {
    cameraOffset: {
      x: 0,
      y: 400,
    },
  },
};

export { SETTINGS };
