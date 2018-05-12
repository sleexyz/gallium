// @flow
import * as React from "react";
import styled from "styled-components";
import { parseTopLevel } from "gallium/lib/parser";
import { type ABT, resolve } from "gallium/lib/resolver";
import * as TopLevel from "gallium/lib/top_level";
import { silence } from "gallium/lib/semantics";
import * as MIDI from "./midi";
import * as MIDIActions from "./midi_actions";
import * as LocalStorage from "./local_storage";
import { connect, type Connect } from "./efx";
import * as Styles from "./styles";
import * as Playback from "./playback";
import * as AppActions from "./app_actions";
import { delay } from "./delay";

type OwnProps = {};

type ContainerProps = {
  text: string,
  invert: boolean
};

const mapStateToProps = ({ text, invert }) => ({ text, invert });

type State = {
  text: string,
  error: ?string
};

export class _Editor extends React.Component<
  Connect<OwnProps, ContainerProps>,
  State
> {
  constructor(props: *) {
    super(props);
    this.state = {
      text: props.text,
      error: undefined
    };
  }

  textarea: ?HTMLTextAreaElement;

  componentDidMount() {
    this.props.dispatch(AppActions.initialize());
    this.updateABT(this.state.text);
  }

  componentWillUnmount() {
    this.props.dispatch(Playback.pause());
  }

  onChange = (e: *) => {
    this.setState({
      text: e.target.value
    });
    this.updateABT(e.target.value);
  };

  updateABT = delay((text: string) => {
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
      this.setState({
        error: e.toString()
      });
    }
  });

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
    const barStyle = this.state.error ? "dotted" : "solid";
    return (
      <Textarea
        id="gallium-textarea"
        onChange={this.onChange}
        onKeyPress={this.onKeyPress}
        value={this.state.text}
        innerRef={this.onTextareaRefLoad}
        barStyle={barStyle}
      />
    );
  }
}

export const Editor = connect(_Editor, mapStateToProps);

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
