float computeLifeLeft(
    in float timeElapsed,
    in float lifetime
) {
    return 1.0 - (timeElapsed / lifetime);
}