// https://github.com/mrdoob/three.js/blob/master/src/math/MathUtils.js#L114
const randomFloat = (low: number, high: number) => {
  return low + Math.random() * (high - low);
};

export { randomFloat };
