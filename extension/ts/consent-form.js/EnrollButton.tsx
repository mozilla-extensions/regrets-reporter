import React, { MouseEvent } from "react";
import { ConsentStatus } from "../background.js/consentStatus";

export interface EnrollButtonProps {
  loading: boolean;
  consentStatus: ConsentStatus;
  onEnroll: () => void;
}

export interface EnrollButtonState {
  userPartOfMarginilizedGroup: null | boolean;
}

export class EnrollButton extends React.Component<
  EnrollButtonProps,
  EnrollButtonState
> {
  public state = {
    loading: true,
    consentStatus: null,
    userPartOfMarginilizedGroup: null,
  };

  cancel(event: MouseEvent) {
    event.preventDefault();
    window.close();
  }

  onClick = async (event: MouseEvent) => {
    event.preventDefault();
    this.props.onEnroll();
  };

  handleUserPartOfMarginilizedGroupOptionChange = changeEvent => {
    console.log({ changeEvent });
    this.setState({
      userPartOfMarginilizedGroup: changeEvent.target.value,
    });
  };

  render() {
    if (this.props.loading) {
      return null;
    }
    return (
      (this.props.consentStatus !== "given" && (
        <button className="enroll-button" onClick={this.onClick}>
          Enroll in the study
        </button>
      )) || (
        <button className="enroll-button enrolled">
          You've enrolled.
          <br />
          Welcome!
          <br />
          <small>(Feel free to close this window)</small>
        </button>
      )
    );
  }
}
