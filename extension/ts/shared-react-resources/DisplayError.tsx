import * as React from "react";
import { MouseEvent } from "react";

export class DisplayError extends React.Component<{}, {}> {
  constructor(props) {
    super(props);
  }

  cancel(event: MouseEvent) {
    event.preventDefault();
    window.close();
  }

  render() {
    return (
      <>
        <header className="panel-section panel-section-header">
          <div className="icon-section-header">
            <img
              src="../icons/green-extensionsicon.svg"
              width="32"
              height="32"
            />
          </div>
          <div className="text-section-header">
            Could not display the "YouTube Regret" form
          </div>
        </header>
        <div className="panel-section panel-section-formElements">
          <span className="text-center">Try reloading the page and try again</span>
        </div>
        <footer className="panel-section panel-section-footer">
          <div onClick={this.cancel} className="panel-section-footer-button">
            Close
          </div>
        </footer>
      </>
    );
  }
}
