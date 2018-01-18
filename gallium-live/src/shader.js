// @flow

const vert = `
attribute vec4 aVertexPosition;
varying vec2 uv;

void main() {
  gl_Position = aVertexPosition;
  uv = aVertexPosition.xy;
}
`;

const frag = `
precision mediump float;

varying vec2 uv;
uniform float time;
uniform float kick;

void main() {
  float t = sin(time* 0.5);
  float i = 1.0*(4.0 * uv.x) - sin(uv.x*10.0 * uv.x *uv.x* 100.0 + t);
  gl_FragColor = vec4(i, i, i, 1.0) * (1.0 - kick);
}
`;

export function registerWebGL(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext("webgl");

  if (!gl) {
    throw new Error("Your browser doesn't seem to support webgl");
  }

  const program = createProgram(gl, {
    fragmentShader: frag,
    vertexShader: vert
  });

  const programInfo = {
    program,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(program, "aVertexPosition")
    },
    uniformLocations: {
      time: gl.getUniformLocation(program, "time"),
      kick: gl.getUniformLocation(program, "kick")
    }
  };

  const buffers = initBuffers(gl);

  const animate = () => {
    drawScene(gl, programInfo, buffers);
    requestAnimationFrame(animate);
  };

  requestAnimationFrame(animate);
}

const createShader = (
  gl: WebGLRenderingContext,
  source: string,
  shaderType: any
): WebGLShader => {
  const shader = gl.createShader(shaderType);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
  }
  return shader;
};

const createProgram = (
  gl: WebGLRenderingContext,
  {
    fragmentShader,
    vertexShader
  }: { fragmentShader: string, vertexShader: string }
): WebGLProgram => {
  const program = gl.createProgram();
  gl.attachShader(program, createShader(gl, vertexShader, gl.VERTEX_SHADER));
  gl.attachShader(
    program,
    createShader(gl, fragmentShader, gl.FRAGMENT_SHADER)
  );
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
  }
  return program;
};

function initBuffers(gl: WebGLRenderingContext) {
  const positionBuffer: WebGLBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  const positions = new Float32Array([1, 1, -1, 1, 1, -1, -1, -1]);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
  return {
    position: positionBuffer
  };
}

function drawScene(gl: WebGLRenderingContext, programInfo, buffers) {
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(
      programInfo.attribLocations.vertexPosition,
      2, // numComponents: pull out 2 values per iteration
      gl.FLOAT, // type: the data in the buffer is 32bit floats
      false, // normalize
      0, // stride: how many bytes to get from one set of values to the next
      0 // offset: how many bytes inside the buffer to start from
    );
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
  }

  gl.useProgram(programInfo.program);

  gl.uniform1f(programInfo.uniformLocations.time, performance.now() / 1000);
  gl.uniform1f(programInfo.uniformLocations.kick, window.kick || 0.0);

  {
    const offset = 0;
    const vertexCount = 4;
    gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
  }
}
