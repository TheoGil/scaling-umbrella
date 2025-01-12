float computeScale(
    in float scaleStart,
    in float scaleEnd,
    in float lifeLeft
) {
    return mix(scaleEnd, scaleStart, lifeLeft);
}