import * as React from "react";
import { MouseEvent } from "react";
import { GeneralErrorMessage } from "../shared-resources/GeneralErrorMessage";

export class DisplayError extends React.Component<
  {
    message?: string;
    additionalInfo?: string;
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
      <div className="text-lg leading-snug px-5 py-4 mx-0">
        <GeneralErrorMessage
          message={this.props.message}
          additionalInfo={this.props.additionalInfo}
          eventId={this.props.eventId}
        />
      </div>
    );
  }
}
