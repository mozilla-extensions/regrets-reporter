import * as React from "react";

export class DisplayError extends React.Component<{}, {}> {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <header className="panel-section panel-section-header">
        <div className="icon-section-header">
          <img src="../icons/green-extensionsicon.svg" width="32" height="32" />
        </div>
        <div className="text-section-header">
          This extension encountered an error
        </div>
      </header>
    );
  }
}
