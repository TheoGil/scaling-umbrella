// https://github.com/mrdoob/three.js/blob/master/src/math/MathUtils.js#L40C1-L45C2
// Linear mapping from range <a1, a2> to range <b1, b2>
const mapLinear = (
  x: number,
  a1: number,
  a2: number,
  b1: number,
  b2: number
) => {
  return b1 + ((x - a1) * (b2 - b1)) / (a2 - a1);
};

export { mapLinear };
