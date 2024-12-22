// https://github.com/mrdoob/three.js/blob/master/src/math/MathUtils.js#L62
const lerp = (x: number, y: number, t: number) => {
  return (1 - t) * x + t * y;
};

export { lerp };
