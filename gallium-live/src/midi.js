// @flow

export async function connectToOutputPort(name: string) {
  // TODO: test
  if (!(navigator && navigator.requestMIDIAccess)) {
    throw new Error("WebMIDI not supported");
  }
  const access = await navigator.requestMIDIAccess();
  for (const output of access.outputs.values()) {
    if (!name || name === output.name) {
      const port = await output.open();
      return port;
    }
  }
  throw new Error(`Could not find output device named ${JSON.stringify(name)}`);
}
