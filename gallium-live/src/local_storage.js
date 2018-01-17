//@flow

export function saveOutputPortName(name: string) {
  window.localStorage.setItem("outputPortName", name);
}

export function loadOutputPortName(): string {
  return window.localStorage.getItem("outputPortName");
}

export function saveText(text: string) {
  window.localStorage.setItem("text", text);
}

export function loadText(): string {
  return window.localStorage.getItem("text");
}

export function saveInvert(invert: boolean) {
  window.localStorage.setItem("invert", invert);
}

export function loadInvert(): boolean {
  return window.localStorage.getItem("invert");
}
