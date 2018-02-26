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
uniform sampler2D text;

void main() {
  float x = clamp(cos(time * 0.1 + cos(uv.x) + (abs(uv.y))) * 2., -1., 1.);
  x = sin(x)/2. + 0.5;
  x = max(kick, x);
  vec4 val = vec4(x, x, x, 1.0);
  float t = time * 0.001;
  for (float i  = 0.; i < 4.; i++) {
    val = val + texture2D(text, fract(tan(0.5 * (uv * pow(i, 1.1) + vec2(0., 0.5)) - 0.5)) + vec2(t, t));
  }
  gl_FragColor = val;
}
`;

type ProgramInfo = {|
  program: WebGLProgram,
  attribLocations: {
    vertexPosition: number
  },
  uniformLocations: {
    time: WebGLUniformLocation,
    kick: WebGLUniformLocation,
    text: WebGLUniformLocation
  }
|};

export function registerWebGL(input: {
  canvas: HTMLCanvasElement,
  textCanvas: HTMLCanvasElement
}) {
  const { canvas, textCanvas } = input;
  const gl = canvas.getContext("webgl");
  if (!gl) {
    throw new Error("Your browser doesn't seem to support webgl");
  }
  resize(gl);
  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

  const program = createProgram(gl, {
    fragmentShader: frag,
    vertexShader: vert
  });

  // TODO: type
  const programInfo = {
    program,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(program, "aVertexPosition")
    },
    uniformLocations: {
      time: gl.getUniformLocation(program, "time"),
      kick: gl.getUniformLocation(program, "kick"),
      text: gl.getUniformLocation(program, "text")
    }
  };

  const state = initState({ gl });

  const animate = () => {
    drawScene({ gl, programInfo, state, textCanvas });
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

type State = {
  buffers: {
    position: WebGLBuffer
  },
  textCanvasTexture: WebGLTexture
};

function initState(input: { gl: WebGLRenderingContext }): State {
  const { gl } = input;

  // positionBuffer
  const positionBuffer: WebGLBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  const positions = new Float32Array([1, 1, -1, 1, 1, -1, -1, -1]);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

  // textCanvas
  const textCanvasTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, textCanvasTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  return {
    buffers: {
      position: positionBuffer
    },
    textCanvasTexture
  };
}

function drawScene(input: {
  gl: WebGLRenderingContext,
  programInfo: ProgramInfo,
  textCanvas: HTMLCanvasElement,
  state: State
}) {
  const { gl, programInfo, state, textCanvas } = input;
  const { buffers } = state;

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(
      programInfo.attribLocations.vertexPosition,
      2, //        numComponents: pull out 2 values per iteration
      gl.FLOAT, // type: the data in the buffer is 32bit floats
      false, //    normalize
      0, //        stride: how many bytes to get from one set of values to the next
      0 //         offset: how many bytes inside the buffer to start from
    );
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
  }

  gl.useProgram(programInfo.program);

  const now = performance.now();
  gl.uniform1f(programInfo.uniformLocations.time, now / 1000);

  {
    let kick = null;
    for (let i = 0; i < window.kickQueue.length; i += 1) {
      const { timestamp, value } = window.kickQueue[i];
      if (timestamp > now) {
        window.kickQueue = window.kickQueue.slice(i);
        break;
      }
      kick = value;
    }
    if (kick != null) {
      gl.uniform1f(programInfo.uniformLocations.kick, kick);
    }
  }

  {
    gl.bindTexture(gl.TEXTURE_2D, state.textCanvasTexture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      textCanvas
    );

    // compute text texture
    gl.uniform1i(programInfo.uniformLocations.text, 0);
    gl.activeTexture(gl.TEXTURE0 + 0);
    gl.bindTexture(gl.TEXTURE_2D, state.textCanvasTexture);
  }

  {
    const offset = 0;
    const vertexCount = 4;
    gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
  }
}

function resize(gl: WebGLRenderingContext) {
  const realToCSSPixels = window.devicePixelRatio;

  const maxDim = Math.max(
    Math.floor(gl.canvas.clientWidth * realToCSSPixels),
    Math.floor(gl.canvas.clientHeight * realToCSSPixels)
  );
  const displayWidth = maxDim;
  const displayHeight = maxDim;

  if (gl.canvas.width !== displayWidth || gl.canvas.height !== displayHeight) {
    gl.canvas.width = displayWidth;
    gl.canvas.height = displayHeight;
  }
}
