import { CatmullRomCurve3, MathUtils, Vector3, Vector3Like } from "three";
import { DEBUG_PARAMS } from "../settings";
import { Bodies, Body, Bounds, Vector } from "matter-js";

const LABEL_TERRAIN_CHUNK = "ground";

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
  tubularSegments: number
) {
  const segments: {
    position: {
      x: number;
      y: number;
    };
    angle: number;
    length: number;
  }[] = [];

  curve.getSpacedPoints(tubularSegments).forEach((point, i, points) => {
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

function generatePhysicBodiesFromCurve(
  curve: CatmullRomCurve3,
  tubularSegments: number
) {
  const POINTS_COUNT = tubularSegments;
  const BODY_BASE_HEIGHT = 100;
  let lowestPoint = curve.points[0].y;
  const vertices: Vector[] = [];

  curve.getSpacedPoints(POINTS_COUNT).forEach(({ x, y }) => {
    vertices.push(Vector.create(x, y));

    if (y > lowestPoint) {
      lowestPoint = y;
    }
  });

  vertices.push(
    Vector.create(
      vertices[vertices.length - 1].x,
      lowestPoint + BODY_BASE_HEIGHT
    )
  );
  vertices.push(Vector.create(vertices[0].x, lowestPoint + BODY_BASE_HEIGHT));

  const body = Bodies.fromVertices(
    vertices[0].x,
    vertices[0].y,
    [vertices],
    {
      isStatic: true,
      friction: DEBUG_PARAMS.terrain.friction,
      frictionStatic: DEBUG_PARAMS.terrain.frictionStatic,
      restitution: DEBUG_PARAMS.terrain.restitution,
      label: LABEL_TERRAIN_CHUNK,
    },
    false,
    DEBUG_PARAMS.segments.physicalBodyOptions.removeCollinear,
    DEBUG_PARAMS.segments.physicalBodyOptions.minimumArea,
    DEBUG_PARAMS.segments.physicalBodyOptions.removeDuplicatePoints
  );

  // https://github.com/liabru/matter-js/issues/958#issuecomment-767860577
  // https://github.com/liabru/matter-js/issues/958#issuecomment-773649689
  const bounds = Bounds.create(vertices);
  const offset = Vector.sub(body.position, body.bounds.min);

  Body.setCentre(body, vertices[0]);
  Body.setPosition(body, {
    x: offset.x + vertices[0].x,
    y: offset.y - (vertices[0].y - bounds.min.y) + vertices[0].y,
  });

  return [body];
}

export {
  generateCurve,
  splitCurveIntoLinearSegments,
  generatePhysicBodiesFromCurve,
  LABEL_TERRAIN_CHUNK,
};
