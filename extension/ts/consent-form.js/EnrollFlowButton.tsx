import * as React from "react";
import { Component, MouseEvent } from "react";
import Modal from "react-modal";
import { Checkbox } from "../shared-react-resources/photon-components-web/photon-components/Checkbox";
import { Radio } from "../shared-react-resources/photon-components-web/photon-components/Radio";
import { Button } from "../shared-react-resources/photon-components-web/photon-components/Button";
import { ConsentStatus } from "../background.js/Store";
import { config } from "../config";

const customStyles = {
  overlay: {
    backgroundColor: "rgb(0,0,0,0.5)",
  },
  content: {
    color: "black",
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
  },
};

// Make sure to bind modal to your appElement (http://reactcommunity.org/react-modal/accessibility/)
Modal.setAppElement("#app");

export interface EnrollFlowButtonProps {
  loading: boolean;
  consentStatus: ConsentStatus;
  onEnroll: ({ userPartOfMarginalizedGroup }) => void;
}

export interface EnrollFlowButtonState {
  modalIsOpen: boolean;
  userPartOfMarginalizedGroup: null | "yes" | "no" | "prefer-not-to-answer";
  userOver18Confirmed: boolean;
  userHasUnderstoodPrivacyNotice: boolean;
}

export class EnrollFlowButton extends Component<
  EnrollFlowButtonProps,
  EnrollFlowButtonState
> {
  public state = {
    loading: true,
    modalIsOpen: false,
    consentStatus: null,
    userPartOfMarginalizedGroup: null,
    userOver18Confirmed: false,
    userHasUnderstoodPrivacyNotice: false,
  };

  onEnroll = async (event: MouseEvent) => {
    event.preventDefault();
    this.closeModal();
    const { userPartOfMarginalizedGroup } = this.state;
    this.props.onEnroll({ userPartOfMarginalizedGroup });
  };

  handleUserOver18CheckboxChange = changeEvent => {
    this.setState({
      userOver18Confirmed: !!changeEvent.target.checked,
    });
  };

  handleUserHasUnderstoodPrivacyNoticeCheckboxChange = changeEvent => {
    this.setState({
      userHasUnderstoodPrivacyNotice: !!changeEvent.target.checked,
    });
  };

  handleUserPartOfMarginalizedGroupOptionChange = changeEvent => {
    this.setState({
      userPartOfMarginalizedGroup: changeEvent.target.value,
    });
  };

  openModal = () => {
    this.setState({ modalIsOpen: true });
  };

  afterOpenModal() {
    // references are now sync'd and can be accessed.
    // subtitle.style.color = '#f00';
  }

  closeModal = () => {
    this.setState({ modalIsOpen: false });
  };

  render() {
    if (this.props.loading) {
      return null;
    }

    return (
      (this.props.consentStatus !== "given" && (
        <div>
          <p>
            Please review the{" "}
            <a
              href={config.privacyNoticeUrl}
              target="_blank"
              className="underline"
            >
              full privacy notice
            </a>{" "}
            before enrolling.
          </p>
          <p>
            <Checkbox
              checked={this.state.userOver18Confirmed}
              onChange={this.handleUserOver18CheckboxChange}
              label="I have read and understood the full privacy notice."
            />
          </p>
          <p>You must be at least 18 years old to enroll.</p>
          <p>
            <Checkbox
              checked={this.state.userHasUnderstoodPrivacyNotice}
              onChange={this.handleUserHasUnderstoodPrivacyNoticeCheckboxChange}
              label="I am at least 18 years old."
            />
          </p>

          <Button
            className="enroll-button h-20 btn rounded-lg items-center"
            disabled={
              !this.state.userOver18Confirmed ||
              !this.state.userHasUnderstoodPrivacyNotice
            }
            onClick={this.openModal}
          >
            Enroll
          </Button>

          <Modal
            isOpen={this.state.modalIsOpen}
            onAfterOpen={this.afterOpenModal}
            onRequestClose={this.closeModal}
            style={customStyles}
            contentLabel="Example Modal"
          >
            <>
              <h2>Great! Only one question left:</h2>

              <div>
                <p>
                  Do you consider yourself to be part of a marginalized group?
                </p>
                <ul className="list-none">
                  <li className="mb-2">
                    <Radio
                      name="userPartOfMarginalizedGroup"
                      value="yes"
                      label="Yes"
                      checked={this.state.userPartOfMarginalizedGroup === "yes"}
                      onChange={
                        this.handleUserPartOfMarginalizedGroupOptionChange
                      }
                    />
                  </li>
                  <li className="mb-2">
                    <Radio
                      name="userPartOfMarginalizedGroup"
                      value="no"
                      label="No"
                      checked={this.state.userPartOfMarginalizedGroup === "no"}
                      onChange={
                        this.handleUserPartOfMarginalizedGroupOptionChange
                      }
                    />
                  </li>
                  <li className="mb-2">
                    <Radio
                      name="userPartOfMarginalizedGroup"
                      value="prefer-not-to-answer"
                      label="I prefer not answer"
                      checked={
                        this.state.userPartOfMarginalizedGroup ===
                        "prefer-not-to-answer"
                      }
                      onChange={
                        this.handleUserPartOfMarginalizedGroupOptionChange
                      }
                    />
                  </li>
                </ul>
              </div>

              <Button
                className="enroll-button h-20 btn rounded-lg items-center"
                disabled={this.state.userPartOfMarginalizedGroup === null}
                onClick={this.onEnroll}
              >
                Enroll
              </Button>
            </>
          </Modal>
        </div>
      )) || (
        <button className="enroll-button enrolled">
          You have enrolled.
          <br />
          Welcome!
        </button>
      )
    );
  }

  onFoo = (checked: boolean) => {
    event.preventDefault();
    console.log({ event });
  };
}
