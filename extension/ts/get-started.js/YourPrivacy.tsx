import * as React from "react";
import { Component } from "react";
import { EnrollFlowButton } from "./EnrollFlowButton";

export interface YourPrivacyProps {}

export interface YourPrivacyState {}

export class YourPrivacy extends Component<YourPrivacyProps, YourPrivacyState> {
  render() {
    return (
      <section className="program-privacy">
        <h2 className="program-header">Your Privacy</h2>
        <p>
          Mozilla understands the sensitivity of the data that is collected and
          works hard to keep your data private and secure:
        </p>
        <ul className="get-started-list">
          <li>
            <strong>General data collection principles</strong>
            <ul className="get-started-list">
              <li>
                No data is collected from inside Private Browsing windows.
              </li>
              <li>
                The collected data will be linked to a randomly generated data
                ID used for this particular study only. It is used to keep a
                specific user's data together on the server, helps us improve
                our analysis and allows us to fulfill legal obligations.
              </li>
            </ul>
          </li>
          <li>
            <strong>Understand how your data is used</strong>
            <ul className="get-started-list">
              <li>
                Only a small number of researchers will have access to raw data.
                When we share results from the study, we will disclose it in a
                way that minimizes the risk of participants being identified.
              </li>
              <li>
                We will share the video IDs of reported videos along with the
                regret category that users report with YouTube to help them
                improve their recommendation systems.
              </li>
            </ul>
          </li>
        </ul>
      </section>
    );
  }
}
