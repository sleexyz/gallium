import { parse } from "gallium";
const node = document.createElement("p");
node.textContent = JSON.stringify(parse("(foo 1 2 3)"));
document.body.appendChild(node);
