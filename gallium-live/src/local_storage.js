//@flow

export function saveOutputPortName(name: string) {
  window.localStorage.setItem("outputPortName", name);
}

export function loadOutputPortName(): ?string {
  return window.localStorage.getItem("outputPortName");
}

export function saveText(text: string) {
  window.localStorage.setItem("text", text);
}

export function loadText(): ?string {
  return window.localStorage.getItem("text");
}

export function saveText2(text: string) {
  window.localStorage.setItem("text2", text);
}

export function loadText2(): ?string {
  return window.localStorage.getItem("text2");
}

export function saveInvert(invert: boolean) {
  window.localStorage.setItem("invert", JSON.stringify(invert));
}

export function loadInvert(): ?boolean {
  return JSON.parse(window.localStorage.getItem("invert"));
}

export function saveBPM(bpm: number) {
  window.localStorage.setItem("bpm", JSON.stringify(bpm));
}

export function loadBPM(): ?number {
  return JSON.parse(window.localStorage.getItem("bpm"));
}
