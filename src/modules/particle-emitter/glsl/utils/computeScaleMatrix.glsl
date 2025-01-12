mat4 computeScaleMatrix(in float scale) {
    return mat4(
        vec4(scale, 0.0, 0.0, 0.0), // x
        vec4(0.0, scale, 0.0, 0.0), // y
        vec4(0.0, 0.0, scale, 0.0), // z
        vec4(0.0, 0.0, 0.0, 1.0)
    );
}