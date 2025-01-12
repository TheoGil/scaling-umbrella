varying float vAlpha;
varying float vLifeLeft;
varying vec3 vColor;
varying float vRotation;

uniform sampler2D uTexture;
uniform float uAlpha;

#include utils/rotate2d;

vec4 defaultColor = vec4(1.);

void main() {
    // Particles are still rendered when they exceed their life expectancy.
    // Even with an alpha set to 0, this can lead to unexpected buggy visual behavior.
    // To prevent this, discard fragment if lifeleft <= 0.
    if (vLifeLeft <= 0.) discard;

    vec2 uv = gl_PointCoord;

    // Apply rotation. Move origin to center, rotate, reset origin.
    uv -= vec2(0.5);
    uv = uv * rotate2d(vRotation);
    uv += vec2(0.5);

    #ifdef EPE_USE_TEXTURE
        vec4 color = texture2D(uTexture, uv);
    #else
        vec4 color = defaultColor;
    #endif

    gl_FragColor = vec4(
        vColor.r * color.r,
        vColor.g * color.g,
        vColor.b * color.b,
        vAlpha * color.a * uAlpha
    );
}
