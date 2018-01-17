// @flow
import * as React from "react";
import styled from "styled-components";
import { parseTopLevel } from "gallium/lib/parser";
import { type ABT, Term, resolve } from "gallium/lib/resolver";
import { globalContext } from "./context";
import { silence } from "gallium/lib/semantics";
import { OutputSelector } from "./OutputSelector";
import * as MIDI from "./midi";
import * as MIDIActions from "./midi_actions";
import * as LocalStorage from "./local_storage";
import { connect, type Connect } from "./efx";
import * as Styles from "./styles";
import * as Playback from "./playback";
import * as AppActions from "./app_actions";
import { ToggleInvert } from "./ToggleInvert";

type OwnProps = {};

type ContainerProps = {
  text: string,
  invert: boolean
};

const mapStateToProps = ({ text, invert }) => ({ text, invert });

type State = {
  text: string,
  abt: ?ABT,
  error: ?string,
  isInitialized: boolean
};

export class _Editor extends React.Component<
  Connect<OwnProps, ContainerProps>,
  State
> {
  constructor(props: *) {
    super(props);
    this.state = {
      text: props.text,
      error: undefined,
      abt: undefined,
      isInitialized: false
    };
  }

  textarea: ?HTMLTextAreaElement;

  componentDidMount() {
    this.props.dispatch(AppActions.initialize());
    this.updateABT(this.state.text);
    setTimeout(() => this.setState({ isInitialized: true }), 0);
  }

  componentWillUnmount() {
    this.props.dispatch(Playback.stop());
  }

  onChange = (e: *) => {
    this.setState({
      text: e.target.value
    });
    this.updateABT(e.target.value);
  };

  updateABT(text: string) {
    try {
      const abt = resolve(globalContext, parseTopLevel(text));
      this.setState({
        abt,
        error: undefined
      });
      this.props.dispatch(store => {
        store.state.pattern = (abt.payload.getValue(): any)(silence);
      });
      LocalStorage.saveText(text);
    } catch (e) {
      this.setState({
        error: e.toString()
      });
    }
  }

  onKeyPress = (e: SyntheticKeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const pos = e.currentTarget.selectionStart;
      const prefix = this.state.text.substr(0, pos);
      const suffix = this.state.text.substr(pos);

      const prePos = prefix.lastIndexOf("\n");
      const line = prefix.substring(prePos + 1);
      const spaceMatch = line.match(/^\ */g);
      if (!spaceMatch) {
        throw new Error("unexpected error: no match");
      }
      const indentation = spaceMatch[0];

      const extraText = "\n" + indentation;
      const newText = prefix + extraText + suffix;
      this.setState(
        {
          text: newText
        },
        () => {
          (this.textarea: any).focus();
          (this.textarea: any).setSelectionRange(
            pos + extraText.length,
            pos + extraText.length
          );
        }
      );
    }
  };

  onTextareaRefLoad = (ref: HTMLTextAreaElement) => {
    this.textarea = ref;
    if (!this.textarea) {
      return;
    }
    this.textarea.focus();
  };

  render() {
    return (
      <Container
        isInitialized={this.state.isInitialized}
        style={{ filter: this.props.invert ? "invert()" : "" }}
      >
        <Pane>
          <PaneChild>
            <Description>gallium.live</Description>
          </PaneChild>
          <PaneChild>
            <Link href="https://github.com/sleexyz/gallium">source</Link>
          </PaneChild>
        </Pane>
        <Content>
          <Textarea
            id="gallium-textarea"
            onChange={this.onChange}
            onKeyPress={this.onKeyPress}
            value={this.state.text}
            innerRef={this.onTextareaRefLoad}
          />
        </Content>
        <Pane>
          <PaneChild>
            <ToggleInvert />
          </PaneChild>
          <PaneChild>
            <OutputSelector />
          </PaneChild>
        </Pane>
      </Container>
    );
  }
}

export const Editor = connect(_Editor, mapStateToProps);

export const Container: React$ComponentType<{
  isInitialized: boolean
}> = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  opacity: ${props => (props.isInitialized ? 1 : 0)};
  transition: opacity 500ms ease-in-out;
  background-color: white;
`;

const Pane = styled.div`
  flex: 0 1 auto;
  min-height: 50px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 0px 20px;
  ${Styles.transition};
  opacity: 0.5;
  &:hover {
    opacity: 1;
  }
`;

const PaneChild = styled.div`
  padding: 10px 20px;
`;

const Content = styled.div`
  padding: 25px 50px;
  flex-grow: 1;
  flex-shrink: 0;
  display: flex;
  background-color: white;
`;

export const Textarea = styled.textarea`
  ${Styles.transition};
  border: 0;
  font-size: 20px;
  background-color: transparent;
  margin: 0;
  flex-grow: 1;
  font-family: monospace;
  box-shadow: -1px 0 0 0 #dfdfdf;
  outline: none;
  padding-left: 50px;
  opacity: 0.75;
  line-height: 1.5em;
  &:focus {
    opacity: 1;
    box-shadow: -1px 0 0 0 #aaa;
  }
`;

const Description = styled.div`
  ${Styles.text};
  font-style: italic;
  letter-spacing: 0.25em;
`;

const Link = styled.a`
  ${Styles.text};
  opacity: 0.75;
  &:visited {
    color: inherit;
  }
`;
