const TAU = 2 * Math.PI;

// TODO: Don't know the math behind it but it is not behaving
// the same as the % operator
const mod = function (a: number, n: number) {
  return ((a % n) + n) % n;
};

// https://gist.github.com/yomotsu/165ba9ee0dc991cb6db5
const getDeltaAngle = (current: number, target: number) => {
  const a = mod(current - target, TAU);
  const b = mod(target - current, TAU);

  return a < b ? -a : b;
};

export { getDeltaAngle };
