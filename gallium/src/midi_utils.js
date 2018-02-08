// @flow

type MIDINote = {
  channel: number,
  pitch: number,
  velocity: number
};

export const noteOn = (data: MIDINote) => {
  const { channel, pitch, velocity } = data;
  return new Uint8Array([9 * 16 + channel, pitch, velocity]);
};

export const noteOff = (data: MIDINote) => {
  const { channel, pitch, velocity } = data;
  return new Uint8Array([8 * 16 + channel, pitch, velocity]);
};
