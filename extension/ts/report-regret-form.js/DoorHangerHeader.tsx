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
      <header className="bg-black text-white px-5 py-2 flex">
        <div className="mr-4.5 mt-0.88 img-doorhanger-icon" />
        <span className="text-2.5xl font-changa font-light">
          {this.props.title}
        </span>
        <div
          onClick={this.close}
          className="ml-auto cursor-pointer img-icon-close-white"
        ></div>
      </header>
    );
  }
}
