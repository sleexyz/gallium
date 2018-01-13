// @flow
import { _Editor } from "./Editor.js";

export function setText({
  wrapper,
  value
}: {
  wrapper: any,
  value: string
}): void {
  wrapper.find("textarea").simulate("change", { target: { value } });
  wrapper.update();
}

export function getText({ wrapper }: { wrapper: any }): string {
  return wrapper.find("textarea").text();
}

export function setCursor({
  wrapper,
  pos
}: {
  wrapper: any,
  pos: number
}): void {
  const ref = wrapper.find(_Editor).instance().textarea;
  ref.setSelectionRange(pos, pos);
}

export function pressKey({
  wrapper,
  key
}: {
  wrapper: any,
  key: string
}): void {
  wrapper.find("textarea").simulate("keyPress", { key });
  wrapper.update();
}
