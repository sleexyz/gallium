// @flow

export interface PartiallyWith<+Data: {}, +Child> {
  type: string;
  data: Data;
  // TODO: getData
  children?: Array<Child>;
  copy(): PartiallyWith<Data, Child>;
  mapData<NextData>(f: (Data) => NextData): PartiallyWith<NextData, Child>;
}

export type With<+Data> = PartiallyWith<Data, With<Data>>;

export type Base = With<{}>;

class Shared<Data: {}, Child> {
  type: string;
  data: Data;
  children: Array<Child>;
  copy(): PartiallyWith<Data, Child> {
    throw new Error("abstract class");
  }
  mapData<NextData>(f: Data => NextData): PartiallyWith<NextData, Child> {
    const node: any = this.copy();
    node.data = f(this.data);
    return node;
  }
}

export class Name<Data: {}, Child> extends Shared<Data, Child>
  implements PartiallyWith<Data, Child> {
  type = "Name";
  value: string;
  constructor(value: string, data: Data) {
    super();
    this.value = value;
    this.data = data;
  }
  copy(): Name<Data, Child> {
    return new Name(this.value, this.data);
  }
}

export class NumLit<Data: {}, Child> extends Shared<Data, Child>
  implements PartiallyWith<Data, Child> {
  type = "NumLit";
  value: number;
  constructor(value: number, data: Data) {
    super();
    this.value = value;
    this.data = data;
  }
  copy(): NumLit<Data, Child> {
    return new NumLit(this.value, this.data);
  }
}

export class HApp<Data: {}, Child> extends Shared<Data, Child>
  implements PartiallyWith<Data, Child> {
  type = "HApp";
  children: Array<Child>;
  spaces: Array<string>;

  constructor(children: Array<Child>, spaces: Array<string>, data: Data) {
    super();
    this.children = [...children];
    this.spaces = spaces;
    this.data = data;
  }
  copy(): HApp<Data, Child> {
    return new HApp(this.children, this.spaces, this.data);
  }
}

export class Paren<Data: {}, Child> extends Shared<Data, Child>
  implements PartiallyWith<Data, Child> {
  type = "Paren";
  children: Array<Child>;
  spaces: Array<string>;

  constructor(children: Array<Child>, spaces: Array<string>, data: Data) {
    super();
    this.children = [...children];
    this.spaces = spaces;
    this.data = data;
  }
  copy(): Paren<Data, Child> {
    return new Paren(this.children, this.spaces, this.data);
  }
}

export class VApp<Data: {}, Child> extends Shared<Data, Child>
  implements PartiallyWith<Data, Child> {
  type = "VApp";
  children: Array<Child>;
  indent: number;
  extraSpaces: Array<string>;
  constructor(
    children: Array<Child>,
    extraSpaces: Array<string>,
    indent: number,
    data: Data
  ) {
    super();
    this.children = [...children];
    this.indent = indent;
    this.extraSpaces = extraSpaces;
    this.data = data;
  }
  copy(): VApp<Data, Child> {
    return new VApp(this.children, this.extraSpaces, this.indent, this.data);
  }
}

export function traverse<Data, NextData>(
  step: (With<Data>) => PartiallyWith<NextData, With<Data>>
): (With<Data>) => With<NextData> {
  const recurse = node => {
    const ret: any = step(node);
    if (ret.children) {
      const newChildren = [];
      for (const child of ret.children) {
        const newChild: any = recurse(child);
        newChildren.push(newChild);
      }
      ret.children = newChildren;
    }
    return ret;
  };
  return recurse;
}
