import { CatmullRomCurve3, MathUtils, Vector3, Vector3Like } from "three";
import { DEBUG_PARAMS } from "../settings";
import { Bodies, Body } from "matter-js";

function rotatePoint2D(p: Vector3, a: number, o: Vector3) {
  return new Vector3(
    Math.cos(a) * (p.x - o.x) - Math.sin(a) * (p.y - o.y) + o.x,
    Math.sin(a) * (p.x - o.x) + Math.cos(a) * (p.y - o.y) + o.y,
    0
  );
}

function generateCurve(options: {
  startPosition: Vector3Like;
  segmentsCount: number;
  segmentsLength: {
    min: number;
    max: number;
  };
  segmentsAngle: {
    min: number;
    max: number;
  };
  alternateAngle: boolean;
}): CatmullRomCurve3 {
  let direction = 1;
  const points: Vector3[] = [new Vector3().copy(options.startPosition)];

  for (let index = 1; index < options.segmentsCount; index++) {
    const segmentLength = MathUtils.randFloat(
      options.segmentsLength.min,
      options.segmentsLength.max
    );

    const segmentAngle =
      MathUtils.randFloat(
        options.segmentsAngle.min,
        options.segmentsAngle.max
      ) * direction;

    const prevPoint = points[index - 1];

    // Copy previous point position, add segmentLength to the X axis
    // and rotate by segmentAngle around previous point to get the new
    // point position
    const point = rotatePoint2D(
      prevPoint.clone().add({
        x: segmentLength,
        y: 0,
        z: 0,
      }),
      segmentAngle,
      prevPoint
    );

    if (options.alternateAngle) {
      direction = direction - direction * 2;
    }

    points.push(point);
  }

  return new CatmullRomCurve3(points);
}

function splitCurveIntoLinearSegments(
  curve: CatmullRomCurve3,
  definition = DEBUG_PARAMS.segments.definition
) {
  const segments: {
    position: {
      x: number;
      y: number;
    };
    angle: number;
    length: number;
  }[] = [];

  curve.getSpacedPoints(definition).forEach((point, i, points) => {
    if (i < points.length - 1) {
      const nextPoint = points[i + 1];

      // const angle = point.angleTo(nextPoint);
      const angle = Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x);
      const distance = point.distanceTo(nextPoint);

      segments.push({
        position: {
          x: point.x,
          y: point.y,
        },
        angle,
        length: distance,
      });

      // ctx.save();

      // // Translate to rect origin
      // ctx.translate(point.x, point.y);

      // // Apply rotation
      // ctx.rotate(angle);

      // // Translate back
      // ctx.translate(-point.x, -point.y); // translate back

      // // Render rect
      // ctx.strokeRect(point.x, point.y, distance, 2);

      // ctx.restore();
    }
  });

  return segments;
}

function generatePhysicBodiesFromCurve(curve: CatmullRomCurve3) {
  const bodies: Body[] = [];

  const thickness = 10;
  const halfThickness = thickness / 2;

  const segments = splitCurveIntoLinearSegments(curve);

  segments.forEach((segment) => {
    const halfLength = segment.length / 2;

    const body = Bodies.rectangle(
      segment.position.x + halfLength,
      segment.position.y + halfThickness,
      segment.length,
      thickness,
      {
        isStatic: true,
        friction: 0,
        frictionStatic: 0,
      }
    );

    // Set the center of the body to the top left corner.
    // This will also set the transformation origin for the rotation.
    Body.setCentre(
      body,
      {
        x: -halfLength,
        y: -halfThickness,
      },
      true
    );

    Body.setAngle(body, segment.angle);

    bodies.push(body);
  });

  return bodies;
}

export {
  generateCurve,
  splitCurveIntoLinearSegments,
  generatePhysicBodiesFromCurve,
};
