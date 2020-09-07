import * as React from "react";
import { Component } from "react";

export interface YourPrivacyProps {}

export interface YourPrivacyState {}

export class YourPrivacy extends Component<YourPrivacyProps, YourPrivacyState> {
  render() {
    return (
      <section className="mt-24">
        <h2 className="text-huge font-changa font-light">Your Privacy</h2>
        <p className="mt-4">
          Mozilla understands the sensitivity of the data that is collected and
          works hard to keep your data private and secure:
        </p>
        <ul>
          <li className="mt-7">
            <div className="font-semibold">
              General data collection principles
            </div>
            <ul className="triangle-bullets">
              <li>
                No data is collected from inside Private Browsing windows.
              </li>
              <li>
                Periodically, aggregated information about your YouTube browsing
                behavior will be sent to Mozilla.
              </li>
              <li>
                Regret reports include some information about your YouTube
                browsing behavior up to 5 hours prior to initiating the report.
                This includes what kind of YouTube pages you have visited and
                how you reached them.
              </li>
            </ul>
          </li>
          <li className="mt-10">
            <div className="font-semibold">
              Understand how your data is used
            </div>
            <ul className="triangle-bullets">
              <li>
                Only a small number of researchers will have access to raw data.
                When we share results from the study, we will disclose it in a
                way that minimizes the risk of participants being identified.
              </li>
              <li>
                We will periodically share insights based on the anonymous data
                sent from this extension with regulators, journalists and
                YouTube employees.
              </li>
            </ul>
          </li>
        </ul>
      </section>
    );
  }
}
