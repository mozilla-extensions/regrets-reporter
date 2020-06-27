import * as React from "react";
import { Component } from "react";

export interface YouMakeTheInternetHealtherProps {}

export interface YouMakeTheInternetHealtherState {}

export class YouMakeTheInternetHealther extends Component<
  YouMakeTheInternetHealtherProps,
  YouMakeTheInternetHealtherState
> {
  render() {
    return (
      <section className="program-thanks">
        <h2 className="program-header">You Help Make The Internet Healthier</h2>
        <p>
          At Mozilla, we pride ourselves on making the internet healthier for
          you, the user! That’s why we need your help.
        </p>
        <p>
          YouTube is one of the most opaque platforms on the market, providing
          researchers and the public with very little data to study widespread
          user-reported problems with harmful content on the platform and draw
          attention to them in an evidence-driven way. Mozilla has already
          brought these concerns forward with YouTube and pressured the company
          to release more data to researchers who are trying to understand what
          content is amplified and pushed down by YouTube’s recommendation
          algorithms.{" "}
        </p>
        <p>
          By participating in this study, you will help us to make better
          decisions on your behalf and shape the future of the Internet!
        </p>
      </section>
    );
  }
}
