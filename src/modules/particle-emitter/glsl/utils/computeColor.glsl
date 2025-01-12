vec3 computeColor(
    in vec3 colorStart,
    in vec3 colorEnd,
    in float lifeLeft
) {
    return mix(colorEnd, colorStart, lifeLeft);
}