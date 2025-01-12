attribute vec3  aTranslate;
attribute vec3  aVelocity;
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
varying float vRotation;

#include utils/computeAlpha;
#include utils/computeNewPosition;
#include utils/computeTimeElapsed;
#include utils/computeLifeLeft;
#include utils/computeScale;
#include utils/computeRotation;
#include utils/computeColor;

void main() {
    float timeElapsed = computeTimeElapsed(uTime, aStartTime);
    float lifeLeft = computeLifeLeft(timeElapsed, aLifetime);
    float scale = computeScale(aSizeStart, aScaleEnd, lifeLeft);

    vAlpha = computeAlpha(timeElapsed, uFadeIn, uFadeOut, aLifetime);
    vLifeLeft = lifeLeft;
    vColor = computeColor(aColorStart, aColorEnd, lifeLeft);
    vRotation = computeRotation(aRotation, aRotationVelocity, timeElapsed).z;

    vec3 translate = computeNewPosition(
        position,
        aTranslate,
        aVelocity,
        aAcceleration,
        lifeLeft,
        timeElapsed
    );

    gl_Position = projectionMatrix * modelViewMatrix * vec4(translate, 1.0);

    gl_PointSize = scale;
}