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
        <div className="p-5 bg-white">
          <div className="text-1.5xl font-serif font-bold leading-none">
            Try reloading the page and try again
          </div>
        </div>
        <footer className="mt-5">
          <div
            onClick={this.cancel}
            className="leading-doorhanger-footer-button bg-red hover:bg-red-70 text-white font-sans font-semibold py-1 px-5 text-xl text-center"
          >
            Close
          </div>
        </footer>
      </DoorHanger>
    );
  }
}
