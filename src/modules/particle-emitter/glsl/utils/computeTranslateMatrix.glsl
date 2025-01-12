mat4 computeTranslateMatrix(in vec3 translate) {
    return mat4(
        vec4(1.0, 0.0, 0.0, 0.0),
        vec4(0.0, 1.0, 0.0, 0.0),
        vec4(0.0, 0.0, 1.0, 0.0),
        vec4(translate.x, translate.y, translate.z, 1.0)
    );
}