import * as React from "react";
import { Component, MouseEvent } from "react";
import "photon-colors/photon-colors.css";
import "../shared-react-resources/photon-components-web/index.css";
import "../shared-react-resources/photon-components-web/attributes";
import "../shared-react-resources/tailwind.css";
import { Input } from "../shared-react-resources/photon-components-web/photon-components/Input";
import { Radio } from "../shared-react-resources/photon-components-web/photon-components/Radio";
import { Link } from "../shared-react-resources/photon-components-web/photon-components/Link";
import { TextArea } from "../shared-react-resources/photon-components-web/photon-components/TextArea";
import { browser, Runtime } from "webextension-polyfill-ts";
import Port = Runtime.Port;
import {
  RegretReport,
  RegretReportData,
  YouTubeNavigationReachType,
  YoutubeVisitMetadata,
} from "../background.js/ReportSummarizer";
import LikertScale from "likert-react";
import {
  MdSentimentDissatisfied,
  MdSentimentNeutral,
  MdSentimentVeryDissatisfied,
} from "react-icons/all";
import { DisplayError } from "../shared-react-resources/DisplayError";
import { YouTubeNavigationUrlType } from "../background.js/lib/youTubeNavigationUrlType";

const youTubeNavigationReachTypeLabels: {
  [k in YouTubeNavigationReachType]: string;
} = {
  search_results: "Search results",
  search_page_for_you_recommendations: "Search page recommendations",
  watch_next_column: "Watch next sidebar",
  watch_next_end_screen: "Watch next end screen",
  search_action: "Search action",
  direct_navigation: "Direct visit",
  page_reload: "Page reload",
  without_clicking_at_all: "Auto-play without any interaction",
  without_clicking_neither_up_next_nor_end_screen: "Auto-play",
  "<failed>": "Unknown",
};

const youTubeNavigationUrlTypeLabels: {
  [k in YouTubeNavigationUrlType]: string;
} = {
  search_results_page: "Search Results",
  watch_page: "Video Page",
  channel_page: "Channel Page",
  other_page: "Other Page",
  not_a_youtube_page: "Somewhere outside of YouTube",
  empty: "(Empty)",
  "<failed>": "(Unknown Page)",
};

export interface ReportRegretFormProps {}

export interface ReportRegretFormState {
  loading: boolean;
  videoThumbUrl: null | string;
  regretReportData: null | RegretReportData;
  userSuppliedRegretCategory: string;
  userSuppliedOtherRegretCategory: string;
  userSuppliedSeverity: null | number;
  userSuppliedOptionalComment: string;
  error: boolean;
  reported: boolean;
}

export class ReportRegretForm extends Component<
  ReportRegretFormProps,
  ReportRegretFormState
> {
  public state = {
    loading: true,
    videoThumbUrl: null,
    regretReportData: null,
    userSuppliedRegretCategory: "",
    userSuppliedOtherRegretCategory: "",
    userSuppliedSeverity: null,
    userSuppliedOptionalComment: "",
    error: false,
    reported: false,
  };

  private backgroundContextPort: Port;

  componentDidMount(): void {
    // console.log("Connecting to the background script");
    this.backgroundContextPort = browser.runtime.connect(browser.runtime.id, {
      name: "port-from-report-regret-form",
    });

    // Send a request to gather the report data
    this.backgroundContextPort.postMessage({
      requestRegretReportData: true,
    });

    // When we have received report data, update state that summarizes it
    this.backgroundContextPort.onMessage.addListener(
      async (m: {
        regretReportData?: RegretReportData;
        errorMessage?: string;
      }) => {
        if (m.regretReportData) {
          const { regretReportData } = m;
          console.log("Regret form received report data", { regretReportData });
          const videoThumbUrl = `https://img.youtube.com/vi/${regretReportData.regretted_youtube_navigation_video_metadata.video_id}/mqdefault.jpg`;
          await this.setState({
            videoThumbUrl,
            regretReportData,
            loading: false,
          });
          return null;
        }
        if (m.errorMessage) {
          await this.setState({
            loading: false,
            error: true,
          });
          return;
        }
        await this.setState({
          loading: false,
          error: true,
        });
      },
    );
  }

  inspectReportContents(event: MouseEvent) {
    event.preventDefault();
    // TODO: Open the report in a new tab/window via a data url
  }

  cancel(event: MouseEvent) {
    event.preventDefault();
    window.close();
  }

  report = async (event: MouseEvent) => {
    event.preventDefault();
    const regretReport: RegretReport = {
      report_data: this.state.regretReportData,
      user_supplied_regret_category: this.state.userSuppliedRegretCategory,
      user_supplied_other_regret_category: this.state
        .userSuppliedOtherRegretCategory,
      user_supplied_severity: this.state.userSuppliedSeverity,
      user_supplied_optional_comment: this.state.userSuppliedOptionalComment,
    };
    this.backgroundContextPort.postMessage({
      regretReport,
    });
    this.setState({ reported: true });
    setTimeout(() => {
      window.close();
    }, 2500);
  };

  handleUserSuppliedRegretCategoryOptionChange = changeEvent => {
    this.setState({
      userSuppliedRegretCategory: changeEvent.target.value,
    });
  };

  render() {
    if (this.state.error) {
      return <DisplayError />;
    }
    if (this.state.loading) {
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
            <div className="text-section-header text-nowrap">Loading ...</div>
          </header>
        </>
      );
    }
    if (this.state.reported) {
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
            <div className="text-section-header text-nowrap">Thank you!</div>
          </header>
          <div className="panel-section panel-section-formElements">
            <span>
              We greatly appreciate your contribution! (This panel will close
              automatically)
            </span>
          </div>{" "}
          <footer className="panel-section panel-section-footer">
            <div onClick={this.cancel} className="panel-section-footer-button">
              Close
            </div>
          </footer>
        </>
      );
    }
    return (
      <form>
        <header className="panel-section panel-section-header">
          <div className="icon-section-header">
            <img
              src="../icons/green-extensionsicon.svg"
              width="32"
              height="32"
            />
          </div>
          <div className="text-section-header">
            Report a "YouTube Regret" to Mozilla
          </div>
        </header>

        {/*
        <div class="panel-section-separator"></div>

        <div class="panel-section panel-section-formElements">
          <div class="panel-formElements-item">
            <strong>Choose the video that altered your recommendations for the worse:</strong>
          </div>
        </div>

        <div class="panel-section panel-section-list">

          <div class="panel-list-item">
            <div class="icon"></div>
            <div class="text">List Item</div>
            <div class="text-shortcut">13:12</div>
          </div>

          <div class="panel-list-item">
            <div class="icon"></div>
            <div class="text">List Item</div>
            <div class="text-shortcut">foo</div>
          </div>

          <div class="panel-list-item">
            <div class="icon"></div>
            <div class="text">List Item</div>
            <div class="text-shortcut">bar</div>
          </div>

        </div>

        <div className="panel-section panel-section-formElements pb-0">
          <div className="panel-formElements-item">
            <h2 className="font-bold">I regret watching this video:</h2>
          </div>
        </div>
        */}

        <div className="px-0">
          <div className="grid grid-cols-5 gap-4 -mx-0">
            <div className="col-span-2 px-0">
              <div className="panel-section panel-section-formElements">
                <div className="panel-formElements-item">
                  <div className="flex-1 mr-1">
                    <div>
                      <img
                        className="w-full"
                        src={this.state.videoThumbUrl}
                        alt=""
                      />
                    </div>
                    <div className="mb-4 mt-1">
                      <h4 className="text-md font-medium text-sm overflow-y-auto h-5">
                        {
                          this.state.regretReportData
                            .regretted_youtube_navigation_video_metadata
                            .video_title
                        }
                      </h4>
                      <p className="mt-1 font-hairline text-sm text-grey-darker text-sm overflow-y-auto h-5">
                        {
                          this.state.regretReportData
                            .regretted_youtube_navigation_video_metadata
                            .view_count_at_navigation_short
                        }{" "}
                        ·{" "}
                        {
                          this.state.regretReportData
                            .regretted_youtube_navigation_video_metadata
                            .video_posting_date
                        }
                      </p>
                    </div>
                    <div>
                      <label className="label-bold">
                        How you arrived at this video:
                      </label>
                      <ul className="list-breadcrumb my-2 text-sm overflow-y-auto h-14">
                        {this.state.regretReportData.youtube_browsing_history_metadata
                          .slice()
                          .reverse()
                          .map(
                            (
                              youtubeVisitMetadata: YoutubeVisitMetadata,
                              index: number,
                            ) => (
                              <>
                                {index === 0 &&
                                  youtubeVisitMetadata.referrer_url_type !==
                                    "empty" && (
                                    <li
                                      className="inline"
                                      key={`referrer-url-type-${index}`}
                                    >
                                      {
                                        youTubeNavigationUrlTypeLabels[
                                          youtubeVisitMetadata.referrer_url_type
                                        ]
                                      }
                                    </li>
                                  )}
                                <li
                                  className="inline"
                                  key={`reach-type-${index}`}
                                >
                                  {
                                    youTubeNavigationReachTypeLabels[
                                      youtubeVisitMetadata.reach_type
                                    ]
                                  }
                                </li>
                                <li
                                  className="inline"
                                  key={`url-type-${index}`}
                                >
                                  {index ===
                                  this.state.regretReportData
                                    .youtube_browsing_history_metadata.length -
                                    1
                                    ? "This Video"
                                    : youTubeNavigationUrlTypeLabels[
                                        youtubeVisitMetadata.url_type
                                      ]}
                                </li>
                              </>
                            ),
                          )}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-span-3 px-0">
              <div className="pb-0 panel-section panel-section-formElements">
                <div className="panel-formElements-item mb-6">
                  <div>
                    <p className="mb-3">
                      <span className="label-bold">
                        Why do you regret watching the video?
                      </span>
                    </p>
                    <ul className="list-none">
                      {[
                        {
                          value: "racist-sexist-homo-trans-phobic-content",
                          label: "Racist, sexist, or homo/transphobic content",
                        },
                        {
                          value: "sexual-content",
                          label: "Sexual content",
                        },
                        {
                          value: "extreme-ideological-content-content",
                          label: "Extreme ideological content",
                        },
                        {
                          value: "violence-disturbing-content",
                          label: "Violence/disturbing content",
                        },
                        {
                          value: "conspiracy-theories",
                          label: "Conspiracy theories",
                        },
                        {
                          value: "not-appropriate-for-my-age-group",
                          label: "Not appropriate for my age group",
                        },
                        {
                          value: "bad-music",
                          label: "Bad music",
                        },
                        {
                          value: "slanderous-content",
                          label: "Slanderous content",
                        },
                      ].map(item => (
                        <li key={item.value} className="mb-2">
                          <Radio
                            name="user_supplied_regret_category"
                            value={item.value}
                            label={item.label}
                            checked={
                              this.state.userSuppliedRegretCategory ===
                              item.value
                            }
                            onChange={
                              this.handleUserSuppliedRegretCategoryOptionChange
                            }
                          />
                        </li>
                      ))}
                      <li className="mb-2">
                        <Radio
                          name="user_supplied_regret_category"
                          value="other"
                          label="Other: "
                          checked={
                            this.state.userSuppliedRegretCategory === "other"
                          }
                          onChange={
                            this.handleUserSuppliedRegretCategoryOptionChange
                          }
                        />
                        <Input
                          className="input__field w-full my-3"
                          id="user_supplied_other_regret_category"
                          name="user_supplied_other_regret_category"
                          placeholder=""
                          disabled={
                            this.state.userSuppliedRegretCategory !== "other"
                          }
                          value={this.state.userSuppliedOtherRegretCategory}
                          onChange={changeEvent => {
                            this.setState({
                              userSuppliedOtherRegretCategory:
                                changeEvent.target.value,
                            });
                          }}
                        />
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-5 gap-4 -mx-0">
            <div className="col-span-2 px-0">
              <div className="pt-0 panel-section panel-section-formElements">
                <div className="">
                  <div className="w-full">
                    <span>
                      <LikertScale
                        reviews={[{ question: "How severe is your regret?" }]}
                        icons={[
                          <MdSentimentNeutral key="3" />,
                          <MdSentimentDissatisfied key="2" />,
                          <MdSentimentVeryDissatisfied key="1" />,
                        ]}
                        onClick={(q, n) =>
                          this.setState({ userSuppliedSeverity: n })
                        }
                      />
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-span-3 px-0">
              <div className="pt-0 panel-section panel-section-formElements">
                <div className="">
                  <div className="w-full">
                    <TextArea
                      className="textarea__field w-full form-textarea mt-1 block w-full"
                      rows={2}
                      id="user_supplied_comment"
                      name="user_supplied_comment"
                      placeholder=""
                      label="Will you tell us more about why you regret watching the
                        video? (Optional)"
                      value={this.state.userSuppliedOptionalComment}
                      onChange={changeEvent => {
                        this.setState({
                          userSuppliedOptionalComment: changeEvent.target.value,
                        });
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="panel-section-separator" />

        <div className="panel-section panel-section-formElements">
          <span>
            Your report is shared with Mozilla according to our{" "}
            <Link
              className="inline"
              target="_blank"
              href="https://www.mozilla.org/en-US/privacy/"
            >
              Privacy Policy
            </Link>
            .<br />
            Click{" "}
            <Link
              className="inline"
              target="_blank"
              href={browser.runtime.getURL(`consent-form/consent-form.html`)}
            >
              here to learn more
            </Link>{" "}
            about the YouTube Regrets research and the specific data that is
            shared.
            {/*
            <a
              className="link inline"
              target="_blank"
              href="./report-regret.html"
            >
              Debug
            </a>
            */}
          </span>
        </div>

        <footer className="panel-section panel-section-footer">
          <div onClick={this.cancel} className="panel-section-footer-button">
            Cancel
          </div>
          <div className="panel-section-footer-separator"></div>
          <div
            onClick={this.report}
            className="panel-section-footer-button default"
          >
            Report
          </div>
        </footer>
      </form>
    );
  }
}
