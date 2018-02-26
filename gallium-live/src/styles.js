// @flow
import { css, injectGlobal } from "styled-components";
import styledNormalize from "styled-normalize";

export function applyGlobalStyles() {
  injectGlobal`
    ${styledNormalize}
    body {
      height: 100%;
    }
  `;
}

export const transition = css`
  transition: all 100ms ease-in-out;
`;

export const text = css`
  font-family: monospace;
`;

export const box = css`
  padding: 8px;
  box-shadow: 0 0 0 1px #dfdfdf;
`;
