

#define PI 3.14159265359
#define PI_2 6.2831

varying vec2 vUv;
uniform vec3 uColor;
uniform float uTime;
uniform float uStep;
uniform float uEdge;
uniform float uSpeed;
uniform float uOffset;

vec2 cartToPolar(vec2 cart) {
    vec2 polar = vec2(vUv.x, vUv.y);
    polar.x -=0.5 ;
    polar.y -=0.5 ;
    float pixel_angle = atan(polar.x,polar.y) ;
    float pixel_distance = length(polar)* 2.0 ;
    vec2 st = vec2(pixel_angle , pixel_distance);
    polar = st * 0.5;

    return polar;
}

void main() {
    float freq = 10.;
    float n = (cnoise(vec3(vUv.x * freq, vUv.y * freq, uTime * 0.001)) + 1.) / 2.;

    float d = distance(vUv, vec2(0.5)) * 2. + n * 0.075;
    float d2 = mod(1. - d + uTime * 0.0002, .1);
    d = smoothstep(.6,.8, d);
    float a = d2 * (1.-d) * 2.;

    gl_FragColor = vec4(uColor, a);
}