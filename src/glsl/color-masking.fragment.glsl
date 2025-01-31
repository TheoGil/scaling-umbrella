varying vec2 vUv;
varying vec4 vPos;

uniform sampler2D uMap;
uniform sampler2D uColorMaskRGB;
uniform sampler2D uColorMaskPWY;
uniform sampler2D uTrailMask;
uniform float uDesaturation;
uniform float uRedsAmount;
uniform float uGreensAmount;
uniform float uBluesAmount;
uniform float uPurplesAmount;
uniform float uWhitesAmount;
uniform float uYellowsAmount;
uniform vec3 uNightOverlayColor;
uniform float uNightOverlayOpacity;
uniform float uTime;
uniform float uScrollSpeed;

// https://github.com/jamieowen/glsl-blend/blob/master/multiply.glsl
vec3 blendMultiply(vec3 base, vec3 blend) {
	return base*blend;
}

vec3 blendMultiply(vec3 base, vec3 blend, float opacity) {
	return (blendMultiply(base, blend) * opacity + base * (1.0 - opacity));
}

void main() {
    vec2 scrolledUV = vec2(vUv.x + (uTime * uScrollSpeed), vUv.y);
    vec4 baseColor = texture2D(uMap, scrolledUV);
    float grayscale = (baseColor.r + baseColor.g + baseColor.b) / 3.0;
    vec4 grayscaleColor = vec4(grayscale, grayscale, grayscale, baseColor.a);

    vec4 colorMaskRGB = texture2D(uColorMaskRGB, scrolledUV);
    vec4 colorMaskPWY = texture2D(uColorMaskPWY, scrolledUV);

    vec4 colorMask = vec4(0, 0, 0, 1.);

    float mask = 1. - uDesaturation;

    mask += colorMaskRGB.r * uRedsAmount;
    mask += colorMaskRGB.g * uGreensAmount;
    mask += colorMaskRGB.b * uBluesAmount;
    mask += colorMaskPWY.r * uPurplesAmount;
    mask += colorMaskPWY.g * uWhitesAmount;
    mask += colorMaskPWY.b * uYellowsAmount;
    mask = clamp(mask, 0., 1.);

    vec4 color = mix(grayscaleColor, baseColor, mask);

    // https://discourse.threejs.org/t/getting-screen-coords-in-shadermaterial-shaders/23783/2
    vec2 screenUv = vPos.xy;
    screenUv /= vPos.w;
    screenUv = screenUv * 0.5 + 0.5;

    // float trailMask = texture2D(uTrailMask, screenUv).r;
    float trailMask = 0.;
    trailMask += smoothstep(0.24, 0.25, texture2D(uTrailMask, screenUv).r) * 0.25;
    trailMask += smoothstep(0.49, 0.50, texture2D(uTrailMask, screenUv).r) * 0.25;
    trailMask += smoothstep(0.60, 0.65, texture2D(uTrailMask, screenUv).r) * 0.25;
    trailMask += smoothstep(0.70, 0.85, texture2D(uTrailMask, screenUv).r) * 0.25;

    vec3 night = blendMultiply(color.rgb, uNightOverlayColor, uNightOverlayOpacity);
    vec3 day = color.rgb;

    color.rgb = mix(night, day, clamp(trailMask, 0., 1.));

    color = linearToOutputTexel(color);

    gl_FragColor = vec4(color);
}
