attribute vec3 aTranslate;
attribute vec3 aVelocity;
attribute vec3  aAcceleration;
attribute float aStartTime;
attribute float aLifetime;
attribute float aSizeStart;
attribute float aScaleEnd;
attribute vec3 aColorStart;
attribute vec3 aColorEnd;
attribute vec3 aRotation;
attribute vec3 aRotationVelocity;

uniform float uTime;
uniform float uFadeIn;
uniform float uFadeOut;

varying float vAlpha;
varying float vLifeLeft;
varying vec3 vColor;
varying vec2 vUv;

#include utils/computeAlpha;
#include utils/computeNewPosition;
#include utils/computeTimeElapsed;
#include utils/computeLifeLeft;
#include utils/computeTranslateMatrix;
#include utils/computeScale;
#include utils/computeScaleMatrix;
#include utils/computeRotationMatrix;
#include utils/computeColor;

void main() {
    float timeElapsed = computeTimeElapsed(uTime, aStartTime);
    float lifeLeft = computeLifeLeft(timeElapsed, aLifetime);
    float scale = computeScale(aSizeStart, aScaleEnd, lifeLeft);

    vAlpha = computeAlpha(timeElapsed, uFadeIn, uFadeOut, aLifetime);
    vLifeLeft = lifeLeft;
    vColor = computeColor(aColorStart, aColorEnd, lifeLeft);
    vUv = uv;

    vec3 translate = computeNewPosition(
        position,
        aTranslate,
        aVelocity,
        aAcceleration,
        lifeLeft,
        timeElapsed
    );

    // Transformation operations are taken from the following snippet:
    // https://gist.github.com/jeanlescure/e27c93b73a10b64e85e4
    mat4 scaleMatrix = computeScaleMatrix(scale);
    mat4 rotationMatrix = computeRotationMatrix(aRotation, aRotationVelocity, timeElapsed);
    mat4 translateMatrix = computeTranslateMatrix(translate);
    
    // The order in which transformation are applied is important.
    // Scale then rotation then translate.
    vec4 newPosition = vec4(position, 1.0);
    newPosition = scaleMatrix * newPosition;
    newPosition = rotationMatrix * newPosition;
    newPosition = translateMatrix * newPosition;

    gl_Position = projectionMatrix * modelViewMatrix * newPosition;
}