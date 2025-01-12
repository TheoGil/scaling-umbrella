varying float vAlpha;   
varying float vLifeLeft;
varying vec3 vColor;
varying vec2 vUv;

uniform sampler2D uTexture;

void main() {
    // Particles are still rendered when they exceed their life expectancy.
    // Even with an alpha set to 0, this can lead to unexpected buggy visual behavior.
    // To prevent this, discard fragment if lifeleft <= 0.
    if (vLifeLeft <= 0.) discard;

    #ifdef EPE_USE_TEXTURE
        vec4 color = texture2D(uTexture, vUv);
    #else
        vec4 color = vec4(1.);
    #endif
    
    gl_FragColor = vec4(
        vColor.r * color.r,
        vColor.g * color.g,
        vColor.b * color.b,
        vAlpha * color.a
    );
}