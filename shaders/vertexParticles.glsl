// uniforms
uniform float time;
uniform sampler2D texture1;

// vertex attrs
attribute float sizeRnd;
attribute float colorRnd;

// varyings are passed to frag shader
varying vec2 vUv;
varying vec3 vPosition;
varying float vColorRandom;

// constant
float PI = 3.141592653589793238;


void main() {
  vUv = uv;
  vColorRandom = colorRnd;
  vec4 mvPosition = modelViewMatrix * vec4( position, 1. );
  gl_PointSize = (30. * sizeRnd + 5.) * ( 1. / - mvPosition.z );
  gl_Position = projectionMatrix * mvPosition;
}
