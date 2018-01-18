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
  float t = time * .25;
  float s = uv.x * uv.x;
  float i = 1.*(4. * uv.x) - sin(s*25. + t) * sin(s*299. + t);
  i = clamp(i,0.,1.);
  i = (i*2. - 1.);
  i = i * (kick*2. - 1.);
  i = i/2. + 0.5;
  gl_FragColor = vec4(i, i, i, 1.0);
}
`;

export function registerWebGL(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext("webgl");
  if (!gl) {
    throw new Error("Your browser doesn't seem to support webgl");
  }
  resize(gl);
  gl.viewport(0,0, gl.drawingBufferWidth, gl.drawingBufferHeight);

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

  const now = performance.now();
  gl.uniform1f(programInfo.uniformLocations.time, now/1000);

  let kick;

  //compute kick value
  for (let i = 0; i < window.kickQueue.length; i += 1) {
    const { timestamp, value } = window.kickQueue[i];
    if (timestamp > now) {
      window.kickQueue = window.kickQueue.slice(i);
      break;
    }
    kick = value;
  }

  gl.uniform1f(programInfo.uniformLocations.kick, kick);

  if (window.strobe) {
    window.kick = 1.0 - window.kick;
  }

  {
    const offset = 0;
    const vertexCount = 4;
    gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
  }
}
function resize(gl: WebGLRenderingContext) {
  const realToCSSPixels = window.devicePixelRatio;

  const displayWidth  = Math.floor(gl.canvas.clientWidth  * realToCSSPixels);
  const displayHeight = Math.floor(gl.canvas.clientHeight * realToCSSPixels);

  if (gl.canvas.width  !== displayWidth || gl.canvas.height !== displayHeight) {
    gl.canvas.width  = displayWidth;
    gl.canvas.height = displayHeight;
  }
}
