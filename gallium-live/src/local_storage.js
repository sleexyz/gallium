//@flow

export function saveOutputPort(name: string) {
  window.localStorage.setItem("outputPort", name);
}

export function loadOutputPort(): string {
  return window.localStorage.getItem("outputPort");
}
