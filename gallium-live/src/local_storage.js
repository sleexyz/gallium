//@flow

export function saveOutputPort(name: string) {
  window.localStorage.setItem("outputPort", name);
}

export function loadOutputPort(): string {
  return window.localStorage.getItem("outputPort");
}

export function saveText(text: string) {
  window.localStorage.setItem("text", text);
}

export function loadText(): string {
  return window.localStorage.getItem("text");
}
