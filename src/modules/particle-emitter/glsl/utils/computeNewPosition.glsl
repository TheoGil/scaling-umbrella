vec3 computeNewPosition(
    in vec3 initialPosition,
    in vec3 translate,
    in vec3 velocity,
    in vec3 acceleration,
    in float lifeLeft,
    in float timeElapsed
) {
    if (lifeLeft >= 0.0) {
        return initialPosition + translate + velocity * timeElapsed + .5 * acceleration * pow(timeElapsed, 2.);
    } else {
        // If dead use initial position
        return initialPosition + translate;
    }
}