varying vec2 vUv;
uniform vec3 uColor;
uniform float uTime;
uniform float uStep;
uniform float uEdge;
uniform float uSpeed;
uniform float uOffset;

void main() {
    float freq = 10.;
    float d = distance(vUv, vec2(0.5)) * 2.;
    float d2 = mod(1. - d + uTime * 0.0002, .1);
    d = smoothstep(.6,.8, d);
    float a = d2 * (1.-d) * 2.;

    gl_FragColor = vec4(uColor, a);
}