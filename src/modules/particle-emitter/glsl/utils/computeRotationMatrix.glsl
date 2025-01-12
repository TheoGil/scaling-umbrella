
#include computeRotation;

mat4 computeRotationMatrix(
    in vec3 rotation,
    in vec3 rotationVelocity,
    in float timeElapsed
) {
    vec3 newRotation = computeRotation(rotation, rotationVelocity, timeElapsed);

    mat4 rXPos = mat4(
        vec4(1.0, 0.0, 0.0, 0.0),
        vec4(0.0, cos(newRotation.x), -sin(newRotation.x), 0.0),
        vec4(0.0, sin(newRotation.x), cos(newRotation.x), 0.0),
        vec4(0.0, 0.0, 0.0, 1.0)
    );
      
    mat4 rYPos = mat4(
        vec4(cos(newRotation.y), 0.0, sin(newRotation.y), 0.0),
        vec4(0.0, 1.0, 0.0, 0.0),
        vec4(-sin(newRotation.y), 0.0, cos(newRotation.y), 0.0),
        vec4(0.0, 0.0, 0.0, 1.0)
    );
      
    mat4 rZPos = mat4(
        vec4(cos(newRotation.z), -sin(newRotation.z), 0.0, 0.0),
        vec4(sin(newRotation.z), cos(newRotation.z), 0.0, 0.0),
        vec4(0.0, 0.0, 1.0, 0.0),
        vec4(0.0, 0.0, 0.0, 1.0)
    );

    return rXPos * rYPos * rZPos;
}