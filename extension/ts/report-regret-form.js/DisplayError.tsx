import * as React from "react";
import { MouseEvent } from "react";
import { DoorHanger } from "./DoorHanger";

export class DisplayError extends React.Component<
  {
    message?: string;
    eventId?: string;
  },
  {}
> {
  constructor(props) {
    super(props);
  }

  cancel(event: MouseEvent) {
    event.preventDefault();
    window.close();
  }

  render() {
    return (
      <DoorHanger
        title={this.props.message || "An error occurred"}
        loading={false}
      >
        <div className="panel-section panel-section-formElements">
          <span className="text-center">
            Try reloading the page and try again
          </span>
        </div>
        <footer className="panel-section panel-section-footer">
          <div onClick={this.cancel} className="panel-section-footer-button">
            Close
          </div>
        </footer>
      </DoorHanger>
    );
  }
}
