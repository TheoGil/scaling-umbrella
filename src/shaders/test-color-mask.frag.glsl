varying vec2 vUv;

void main() {
  float baseBloom = clamp(0., 1., pow(blob(
    uBaseBloomNoiseAmp,
    uBaseBloomNoiseFreq,
    uBaseBloomNoiseSpeed,
    uBaseBloomRadius,
    uBaseBloomSmooth
  ), uBaseBloomPow) * uBaseBloomAlpha);

  gl_FragColor = vec4(vec3(baseBloom), 1.);
}

