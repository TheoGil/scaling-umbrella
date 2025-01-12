// https://github.com/terkelg/math-toolbox/blob/master/src/wrap.js
function wrap(value: number, min: number, max: number) {
  const range = max - min
  if (range <= 0) {
    return 0
  }

  let result = (value - min) % range
  if (result < 0) {
    result += range
  }

  return result + min
}

export { wrap }
