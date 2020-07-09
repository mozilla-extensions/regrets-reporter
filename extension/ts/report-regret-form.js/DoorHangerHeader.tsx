import React, { Component, MouseEvent } from "react";

export interface DoorHangerHeaderProps {
  title: string;
}

export interface DoorHangerHeaderState {}

export class DoorHangerHeader extends Component<
  DoorHangerHeaderProps,
  DoorHangerHeaderState
> {
  public state = {
    loading: true,
  };

  close(event: MouseEvent) {
    event.preventDefault();
    window.close();
  }

  render() {
    return (
      <header className="bg-black text-white p-6 flex">
        <img
          className="mr-4"
          src="../icons/green-extensionsicon.svg"
          width="23"
          height="20"
        />
        <span className="text-2xl">{this.props.title}</span>
        <div
          onClick={this.close}
          className="ml-auto cursor-pointer img-close-doorhanger"
        ></div>
      </header>
    );
  }
}
