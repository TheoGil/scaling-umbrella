vec3 computeRotation(
    in vec3 rotation,
    in vec3 rotationVelocity,
    in float timeElapsed
) {
    return rotation + (rotationVelocity * vec3(timeElapsed));
}