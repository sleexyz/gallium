// @flow

export type Device = {
  name: string,
  send: (Uint8Array, ?number) => void,
  open: () => Promise<Device>
};

export function makeDummyDevice(name: string) {
  const dummyDevice = {
    name,
    send: () => {},
    open: async () => dummyDevice
  };
  return dummyDevice;
}

export async function connectToOutputPort(name: string): Promise<Device> {
  if (!navigator.requestMIDIAccess) {
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
