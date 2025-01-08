// fragment shader
uniform sampler2D uInputTexture;
uniform sampler2D uNoiseTexture;
uniform vec2 uTipPosOld;
uniform vec2 uTipPosNew;
uniform float uThickness;
uniform float uTime;
uniform float uTraveling;
uniform float uBanding;
varying vec2 vUv;

uniform vec2 uMovement;

float lineSegment(vec2 p, vec2 a, vec2 b, float thickness) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
  float idk = length(pa - ba*h);
  // idk = smoothstep(thickness, thickness * .5, idk);
  idk = smoothstep(thickness, thickness - uBanding, idk);
  return idk;
}

void main() {
  vec4 noise1 = texture2D(uNoiseTexture, vUv * 1.0 + vec2(uTime *.1, .0));
  
  vec2 stretchUv = vUv;
  stretchUv -= uTipPosNew;
  stretchUv *= .96 + (.5-noise1.b) * .1;
  stretchUv += uTipPosNew;
  
  vec2 displacement = vec2(uTraveling, (.5-noise1.r)*.001);

  displacement = vec2(uTraveling, (.5 - noise1.r) * .001 + uMovement.y);
  
  stretchUv += displacement;
  
  vec4 oldTexture = texture2D(uInputTexture, stretchUv);

  vec4 col = oldTexture * .99;

  float lineValue = 0.;
  float th = uThickness + (.5-noise1.r) * .001;
  lineValue = lineSegment(vUv , uTipPosOld - displacement, uTipPosNew, th);
  col.rgb += lineValue;


  gl_FragColor = vec4(col);
}