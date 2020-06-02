import * as React from "react";
import { Component, MouseEvent } from "react";
import Modal from "react-modal";
import { Radio } from "../../shared-resources/photon-components-web/photon-components/Radio";
import { Button } from "../../shared-resources/photon-components-web/photon-components/Button";
import { Input } from "../../shared-resources/photon-components-web/photon-components/Input";
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

export interface SupplyDemographicsButtonState
  extends UserSuppliedDemographics {
  modalIsOpen: boolean;
}

export class SupplyDemographicsButton extends Component<
  SupplyDemographicsButtonProps,
  SupplyDemographicsButtonState
> {
  public state = {
    modalIsOpen: false,
    dem_age: "",
    dem_gender: null,
    dem_gender_descr: "",
    last_updated: null,
  };

  onSubmit = async (event: MouseEvent) => {
    event.preventDefault();
    this.closeModal();
    const { dem_age, dem_gender, dem_gender_descr } = this.state;
    const userSuppliedDemographics = {
      dem_age: dem_age === "" ? null : dem_age,
      dem_gender,
      dem_gender_descr: dem_gender_descr === "" ? null : dem_gender_descr,
      last_updated: new Date().toISOString(),
    };
    this.props.onSaveUserSuppliedDemographics(userSuppliedDemographics);
  };

  handleChange = changeEvent => {
    const { name, value } = changeEvent.target;
    console.log({ name, value });
    switch (name) {
      case "dem_age":
        return this.setState({ dem_age: value });
      case "dem_gender":
        return this.setState({ dem_gender: value });
      case "dem_gender_descr":
        return this.setState({ dem_gender_descr: value });
    }
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
              <Input
                label="What is your age?"
                name="dem_age"
                value={this.state.dem_age}
                onChange={this.handleChange}
              />
            </div>

            <h2>Question 2:</h2>
            <div>
              <p>What is your gender?</p>
              <ul className="list-none">
                {[
                  {
                    value: "man",
                    label: "Man",
                  },
                  {
                    value: "woman",
                    label: "Woman",
                  },
                  {
                    value: "other-description",
                    label: "These don't describe me",
                  },
                ].map(item => (
                  <li key={item.value} className="mb-2">
                    <Radio
                      name="dem_gender"
                      value={item.value}
                      label={item.label}
                      checked={this.state.dem_gender === item.value}
                      onChange={this.handleChange}
                    />
                  </li>
                ))}
              </ul>
              {this.state.dem_gender === "other-description" && (
                <Input
                  label="How would you describe your gender?"
                  name="dem_gender_descr"
                  value={this.state.dem_gender_descr}
                  onChange={this.handleChange}
                />
              )}
            </div>
            <Button
              className="bg-green hover:bg-green-dark text-white font-bold m-4 py-4 px-8 rounded-full items-center"
              onClick={this.onSubmit}
            >
              Save
            </Button>
          </>
        </Modal>
      </div>
    );
  }
}
