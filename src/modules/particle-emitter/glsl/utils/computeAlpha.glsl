float computeAlpha(
    in float timeElapsed,
    in float fadeIn,
    in float fadeOut,
    in float lifetime
) {
    float alpha = 0.;

    if (timeElapsed < fadeIn) {
        alpha = timeElapsed / fadeIn;
    }

    if (
        timeElapsed >= fadeIn &&
        timeElapsed <= (lifetime - fadeOut)
    ) {
        alpha = 1.0;
    }

    if (timeElapsed > (lifetime - fadeOut)) {
        alpha = 1.0 - (timeElapsed - (lifetime - fadeOut)) / fadeOut;
    }

    return alpha;
}