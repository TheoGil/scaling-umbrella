varying vec2 vUv;
varying vec4 vPos;

uniform sampler2D uMap;
uniform sampler2D uColorMaskRGB;
uniform sampler2D uColorMaskPWY;
uniform float uDesaturation;
uniform float uRedsAmount;
uniform float uGreensAmount;
uniform float uBluesAmount;
uniform float uPurplesAmount;
uniform float uWhitesAmount;
uniform float uYellowsAmount;
uniform vec3 uNightOverlayColor;
uniform float uNightOverlayOpacity;

// https://github.com/jamieowen/glsl-blend/blob/master/screen.glsl
float blendScreen(float base, float blend) {
	return 1.0-((1.0-base)*(1.0-blend));
}

vec3 blendScreen(vec3 base, vec3 blend) {
	return vec3(blendScreen(base.r,blend.r),blendScreen(base.g,blend.g),blendScreen(base.b,blend.b));
}

vec3 blendScreen(vec3 base, vec3 blend, float opacity) {
	return (blendScreen(base, blend) * opacity + base * (1.0 - opacity));
}

//  https://github.com/jamieowen/glsl-blend/blob/master/overlay.glsl
float blendOverlay(float base, float blend) {
	return base<0.5?(2.0*base*blend):(1.0-2.0*(1.0-base)*(1.0-blend));
}

vec3 blendOverlay(vec3 base, vec3 blend) {
	return vec3(blendOverlay(base.r,blend.r),blendOverlay(base.g,blend.g),blendOverlay(base.b,blend.b));
}

vec3 blendOverlay(vec3 base, vec3 blend, float opacity) {
	return (blendOverlay(base, blend) * opacity + base * (1.0 - opacity));
}

void main() {
    vec4 baseColor = texture2D(uMap, vUv);
    float grayscale = (baseColor.r + baseColor.g + baseColor.b) / 3.0;
    vec4 grayscaleColor = vec4(grayscale, grayscale, grayscale, baseColor.a);

    vec4 colorMaskRGB = texture2D(uColorMaskRGB, vUv);
    vec4 colorMaskPWY = texture2D(uColorMaskPWY, vUv);

    vec4 colorMask = vec4(0, 0, 0, 1.);

    float mask = 1. - uDesaturation;

    mask += colorMaskRGB.r * uRedsAmount;
    mask += colorMaskRGB.g * uGreensAmount;
    mask += colorMaskRGB.b * uBluesAmount;
    mask += colorMaskPWY.r * uPurplesAmount;
    mask += colorMaskPWY.g * uWhitesAmount;
    mask += colorMaskPWY.b * uYellowsAmount;

    vec4 color = mix(grayscaleColor, baseColor, mask);

    color.rgb = blendOverlay(color.rgb, uNightOverlayColor, uNightOverlayOpacity * (1. - mask));

    // https://discourse.threejs.org/t/getting-screen-coords-in-shadermaterial-shaders/23783/2
    vec2 screenUv = vPos.xy;
    screenUv /= vPos.w;
    screenUv = screenUv * 0.5 + 0.5;
  
  	// vec2 uv = fract( screenUv * 10.0 );
    // gl_FragColor = vec4( uv, 0.0, 1.0 );
    // color.r = screenUv.x;
    // color.g = screenUv.y;
    // color.b = 0.;

    gl_FragColor = vec4(color);
}
