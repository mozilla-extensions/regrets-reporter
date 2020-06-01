import * as React from "react";
import { Component, MouseEvent } from "react";
import Modal from "react-modal";
import { Radio } from "../../shared-resources/photon-components-web/photon-components/Radio";
import { Button } from "../../shared-resources/photon-components-web/photon-components/Button";
import { UserSuppliedDemographics } from "../../background.js/Store";

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

export interface SupplyDemographicsButtonProps {
  loading: boolean;
  userSuppliedDemographics: UserSuppliedDemographics;
  onSaveUserSuppliedDemographics: (
    userSuppliedDemographics: UserSuppliedDemographics,
  ) => void;
}

export interface SupplyDemographicsButtonState {
  modalIsOpen: boolean;
  userPartOfMarginalizedGroup: null | "yes" | "no" | "prefer-not-to-answer";
}

export class SupplyDemographicsButton extends Component<
  SupplyDemographicsButtonProps,
  SupplyDemographicsButtonState
> {
  public state = {
    modalIsOpen: false,
    userPartOfMarginalizedGroup: null,
  };

  onSaveUserSuppliedDemographics = async (event: MouseEvent) => {
    event.preventDefault();
    this.closeModal();
    const { userPartOfMarginalizedGroup } = this.state;
    const userSuppliedDemographics = {
      user_part_of_marginalized_group: userPartOfMarginalizedGroup,
      last_updated: new Date().toISOString(),
    };
    this.props.onSaveUserSuppliedDemographics(userSuppliedDemographics);
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
  }

  closeModal = () => {
    this.setState({ modalIsOpen: false });
  };

  render() {
    if (this.props.loading) {
      return null;
    }

    return (
      <div>
        <Button
          className="bg-green hover:bg-green-dark text-white font-bold m-4 py-4 px-8 rounded-full items-center"
          onClick={this.openModal}
        >
          {(this.props.userSuppliedDemographics.last_updated === null &&
            "Take the mini-survey") ||
            "Re-take the mini-survey"}
        </Button>

        <Modal
          isOpen={this.state.modalIsOpen}
          onAfterOpen={this.afterOpenModal}
          onRequestClose={this.closeModal}
          style={customStyles}
          contentLabel="Modal"
        >
          <>
            <h2>Question 1:</h2>

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
              onClick={this.onSaveUserSuppliedDemographics}
            >
              Save
            </Button>
          </>
        </Modal>
      </div>
    );
  }
}
