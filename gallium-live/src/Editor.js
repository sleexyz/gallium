// @flow
import * as React from "react";
import styled from "styled-components";
import { parseTopLevel } from "gallium/lib/parser";
import { type ABT, resolve } from "gallium/lib/resolver";
import * as TopLevel from "gallium/lib/top_level";
import { silence } from "gallium/lib/semantics";
import { OutputSelector } from "./OutputSelector";
import * as MIDI from "./midi";
import * as MIDIActions from "./midi_actions";
import * as LocalStorage from "./local_storage";
import { connect, type Connect } from "./efx";
import * as Styles from "./styles";
import * as Playback from "./playback";
import * as AppActions from "./app_actions";
import { BPMSelector } from "./BPMSelector";
import { ToggleInvert } from "./ToggleInvert";

type OwnProps = {};

type ContainerProps = {
  text: string,
  invert: boolean
};

const mapStateToProps = ({ text, text2, invert }) => ({ text, text2, invert });

type State = {
  text: string,
  text2: string,
  error: ?string,
  error2: ?string,
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
      text2: props.text2,
      error: undefined,
      error2: undefined,
      isInitialized: false
    };
  }

  textarea: ?HTMLTextAreaElement;
  textarea2: ?HTMLTextAreaElement;

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
      const abt = TopLevel.parseAndResolve(text);
      this.setState({
        error: undefined
      });
      this.props.dispatch(store => {
        store.state.pattern = TopLevel.interpret(abt);
      });
      LocalStorage.saveText(text);
    } catch (e) {
      console.error(e);
      this.setState({
        error: e.toString()
      });
    }
  }

  onChange2 = (e: *) => {
    this.setState({
      text2: e.target.value
    });
    this.updateABT2(e.target.value);
  };

  updateABT2(text: string) {
    try {
      const abt = TopLevel.parseAndResolve(text);
      this.setState({
        error2: undefined
      });
      this.props.dispatch(store => {
        store.state.pattern2 = TopLevel.interpret(abt);
      });
      LocalStorage.saveText2(text);
    } catch (e) {
      console.error(e);
      this.setState({
        error2: e.toString()
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

  onKeyPress2 = (e: SyntheticKeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const pos = e.currentTarget.selectionStart;
      const prefix = this.state.text2.substr(0, pos);
      const suffix = this.state.text2.substr(pos);

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
          text2: newText
        },
        () => {
          (this.textarea2: any).focus();
          (this.textarea2: any).setSelectionRange(
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

  onTextarea2RefLoad = (ref: HTMLTextAreaElement) => {
    this.textarea2 = ref;
    if (!this.textarea2) {
      return;
    }
  };

  render() {
    const barStyle = this.state.error ? "dotted" : "solid";
    const barStyle2 = this.state.error2 ? "dotted" : "solid";
    return (
      <Container
        isInitialized={this.state.isInitialized}
        style={{ filter: this.props.invert ? "invert(100%)" : "" }}
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
            barStyle={barStyle}
          />
          <Textarea
            id="gallium-textarea2"
            onChange={this.onChange2}
            onKeyPress={this.onKeyPress2}
            value={this.state.text2}
            innerRef={this.onTextarea2RefLoad}
            barStyle={barStyle2}
          />
        </Content>
        <Pane>
          <PaneChild>
            <BPMSelector />
          </PaneChild>
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
  padding: 10vh 1vw;
  flex-grow: 1;
  flex-shrink: 0;
  display: flex;
  background-color: white;
`;

export const Textarea: React.ComponentType<{
  barStyle: string
}> = styled.textarea`
  ${Styles.transition};
  border: 0;
  font-size: 16px;
  background-color: transparent;
  margin: 0;
  flex-grow: 1;
  font-family: monospace;
  outline: none;
  padding: 0;
  padding-left: 0.2em;
  border-left: 1px ${props => props.barStyle} #000;
  opacity: 0.75;
  &:focus {
    opacity: 1;
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
