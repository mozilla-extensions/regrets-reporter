import React, { Component } from "react";
import { DoorHangerHeader } from "./DoorHangerHeader";

export interface DoorHangerProps {
  title: string;
  loading: boolean;
}

export interface DoorHangerState {}

export class DoorHanger extends Component<DoorHangerProps, DoorHangerState> {
  render() {
    if (this.props.loading) {
      return <DoorHangerHeader title="Loading..." />;
    }
    return (
      <>
        <DoorHangerHeader title={this.props.title} />
        <div className="bg-white">{this.props.children}</div>
      </>
    );
  }
}
