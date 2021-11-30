import React, { Component } from "react";
import { DoorHangerHeader } from "./DoorHangerHeader";
import "./DoorHanger.css";
import "typeface-changa";
import "typeface-zilla-slab";
import "typeface-nunito-sans";

export interface DoorHangerProps {
  title?: string;
  loading?: boolean;
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
        <div className="doorhanger-content-gradient p-0">
          <div className="doorhanger-content-circles p-4 font-sans">
            {this.props.children}
          </div>
        </div>
      </>
    );
  }
}
