// https://stackoverflow.com/a/39463118
function divideIntoSegments(
  startPoint: { x: number; y: number },
  endPoint: { x: number; y: number },
  divide: number
) {
  let { x: x1, y: y1 } = startPoint;
  let { x: x2, y: y2 } = endPoint;

  let dx = (x2 - x1) / divide;
  let dy = (y2 - y1) / divide;

  let interiorPoints = [];

  for (let i = 1; i < divide; i++)
    interiorPoints.push({ x: x1 + i * dx, y: y1 + i * dy });

  return [startPoint, ...interiorPoints, endPoint];
}

export { divideIntoSegments };
