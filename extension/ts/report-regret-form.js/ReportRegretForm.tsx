import * as React from "react";
import { Component, MouseEvent } from "react";
import "photon-colors/photon-colors.css";
import "../shared-resources/photon-components-web/index.css";
import "../shared-resources/photon-components-web/attributes";
import "../shared-resources/tailwind.css";
import { Input } from "../shared-resources/photon-components-web/photon-components/Input";
import { Checkbox } from "../shared-resources/photon-components-web/photon-components/Checkbox";
import "../shared-resources/photon-components-web/photon-components/Checkbox/light-theme.css";
import { Link } from "../shared-resources/photon-components-web/photon-components/Link";
import { TextArea } from "../shared-resources/photon-components-web/photon-components/TextArea";
import "./index.css";
import { browser, Runtime } from "webextension-polyfill-ts";
import Port = Runtime.Port;
import {
  RegretReport,
  RegretReportData,
  YouTubeNavigationMetadata,
  YouTubePageEntryPoint,
} from "../background.js/ReportSummarizer";
import LikertScale from "likert-react";
import {
  MdSentimentDissatisfied,
  MdSentimentNeutral,
  MdSentimentVeryDissatisfied,
  MdHelp,
} from "react-icons/md";
import { DisplayError } from "../shared-resources/DisplayError";
import { getCurrentTab } from "../background.js/lib/getCurrentTab";
import { YouTubeNavigationUrlType } from "../background.js/lib/youTubeNavigationUrlType";
import { config } from "../config";
import { captureExceptionWithExtras } from "../shared-resources/ErrorReporting";

const youTubePageEntryPointLabels: {
  [k in YouTubePageEntryPoint]: string;
} = {
  direct_navigation: "Direct visit",
  page_reload: "Direct visit",
  search_results_page: "Search Results",
  watch_page: "Video Page",
  user_page: "User Page",
  channel_page: "Channel Page",
  other: "Other",
  youtube_main_page: "YouTube.com",
  not_a_youtube_page: "Somewhere outside of YouTube",
  "<failed>": "(Unknown)",
};
const youTubeNavigationUrlTypeLabels: {
  [k in YouTubeNavigationUrlType]: string;
} = {
  search_results_page: "Search Results",
  search_results_page_load_more_results: "Load More Search Results",
  watch_page: "Video Page",
  user_page: "User Page",
  channel_page: "Channel Page",
  other: "Other Page",
  unknown: "Unknown Page",
  youtube_main_page: "YouTube.com",
  misc_xhr: "Misc XHR Request",
  not_a_youtube_page: "Somewhere outside of YouTube",
  empty: "(Empty)",
  prefetch: "(Pre-fetch)",
  "<failed>": "(Unknown Page)",
};

export interface ReportRegretFormProps {}

export interface ReportRegretFormState {
  loading: boolean;
  videoThumbUrl: null | string;
  regretReportData: null | RegretReportData;
  userSuppliedRegretCategories: string[];
  userSuppliedOtherRegretCategory: string;
  userSuppliedSeverity: number;
  userSuppliedOptionalComment: string;
  error: boolean;
  reported: boolean;
}

export class ReportRegretForm extends Component<
  ReportRegretFormProps,
  ReportRegretFormState
> {
  private defaultFormState = {
    userSuppliedRegretCategories: [],
    userSuppliedOtherRegretCategory: "",
    userSuppliedSeverity: -1,
    userSuppliedOptionalComment: "",
  };

  public state = {
    loading: true,
    videoThumbUrl: null,
    regretReportData: null,
    ...this.defaultFormState,
    error: false,
    reported: false,
  };

  private backgroundContextPort: Port;

  async componentDidMount(): Promise<void> {
    // console.log("Connecting to the background script");
    this.backgroundContextPort = browser.runtime.connect(browser.runtime.id, {
      name: "port-from-report-regret-form",
    });

    // Send a request to gather the report data
    const currentTab = await getCurrentTab();
    let skipWindowAndTabIdFilter = false;
    if (
      typeof window !== "undefined" &&
      window.location &&
      window.location.search
    ) {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("skipWindowAndTabIdFilter")) {
        skipWindowAndTabIdFilter = true;
      }
    }
    this.backgroundContextPort.postMessage({
      requestRegretReportData: {
        windowId: currentTab.windowId,
        tabId: currentTab.id,
        skipWindowAndTabIdFilter,
      },
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
          const videoId =
            regretReportData.youtube_navigation_metadata.video_metadata
              .video_id;
          const videoThumbUrl = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;

          // Hydrate draft contents from a previous form edit if available
          const storageKey = `report-regret-form-state:${videoId}`;
          const persistedState = localStorage.getItem(storageKey);
          const {
            userSuppliedRegretCategories,
            userSuppliedOtherRegretCategory,
            userSuppliedSeverity,
            userSuppliedOptionalComment,
          } = persistedState
            ? JSON.parse(persistedState)
            : this.defaultFormState;

          await this.setState({
            regretReportData,
            videoThumbUrl,
            userSuppliedRegretCategories,
            userSuppliedOtherRegretCategory,
            userSuppliedSeverity,
            userSuppliedOptionalComment,
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
        captureExceptionWithExtras(new Error("Unexpected message"), { m });
        console.error("Unexpected message", { m });
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
      user_supplied_regret_categories: this.state.userSuppliedRegretCategories,
      user_supplied_other_regret_category: this.state
        .userSuppliedOtherRegretCategory,
      user_supplied_severity: this.state.userSuppliedSeverity,
      user_supplied_optional_comment: this.state.userSuppliedOptionalComment,
    };
    this.backgroundContextPort.postMessage({
      regretReport,
    });
    const {
      userSuppliedRegretCategories,
      userSuppliedOtherRegretCategory,
      userSuppliedSeverity,
      userSuppliedOptionalComment,
    } = this.defaultFormState;
    await this.setState({
      reported: true,
      userSuppliedRegretCategories,
      userSuppliedOtherRegretCategory,
      userSuppliedSeverity,
      userSuppliedOptionalComment,
    });
    /*
    setTimeout(() => {
      window.close();
    }, 2500);
    */
    return this.persistFormState();
  };

  handleChange = async changeEvent => {
    const { name, value } = changeEvent.target;
    switch (name) {
      case "user_supplied_regret_categories":
        await this.handleUserSuppliedRegretCategoryOptionChange(changeEvent);
        break;
      case "user_supplied_other_regret_category":
        await this.setState({
          userSuppliedOtherRegretCategory: value,
        });
        break;
      case "user_supplied_optional_comment":
        await this.setState({
          userSuppliedOptionalComment: value,
        });
        break;
    }
    return this.persistFormState();
  };

  handleUserSuppliedRegretCategoryOptionChange = changeEvent => {
    const newValue = changeEvent.target.value;
    const userSuppliedRegretCategories = this.state
      .userSuppliedRegretCategories;
    const index = userSuppliedRegretCategories.indexOf(newValue);
    const checked = changeEvent.target.checked;
    if (checked) {
      if (index === -1) {
        this.setState({
          userSuppliedRegretCategories: [
            ...userSuppliedRegretCategories,
            newValue,
          ],
        });
      }
    } else {
      if (index > -1) {
        userSuppliedRegretCategories.splice(index, 1);
        this.setState({
          userSuppliedRegretCategories: userSuppliedRegretCategories,
        });
      }
    }
  };

  persistFormState = () => {
    const {
      userSuppliedRegretCategories,
      userSuppliedOtherRegretCategory,
      userSuppliedSeverity,
      userSuppliedOptionalComment,
    } = this.state;
    const videoId = this.state.regretReportData.youtube_navigation_metadata
      .video_metadata.video_id;
    const storageKey = `report-regret-form-state:${videoId}`;
    const stateToPersist = JSON.stringify({
      userSuppliedRegretCategories,
      userSuppliedOtherRegretCategory,
      userSuppliedSeverity,
      userSuppliedOptionalComment,
    });
    localStorage.setItem(storageKey, stateToPersist);
  };

  render() {
    if (this.state.error) {
      return (
        <DisplayError message={`Could not display the "YouTube Regret" form`} />
      );
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
            <div className="text-section-header text-nowrap">
              We greatly appreciate your contribution!
            </div>
          </header>
          <div className="panel-section panel-section-formElements">
            <span>
              If you believe that the content you identified in this submission
              constitutes abuse under YouTube’s policies, please report it to
              YouTube via its abuse-reporting platform.
            </span>
          </div>{" "}
          <footer className="panel-section panel-section-footer">
            <div
              onClick={this.cancel}
              className="panel-section-footer-button default"
            >
              Close
            </div>
          </footer>
        </>
      );
    }
    const youTubeNavigationMetadata: YouTubeNavigationMetadata = this.state
      .regretReportData.youtube_navigation_metadata;
    const parentYouTubeNavigationsMetadata: YouTubeNavigationMetadata[] = this
      .state.regretReportData.parent_youtube_navigations_metadata;
    const howTheVideoWasReached = parentYouTubeNavigationsMetadata
      .slice()
      .reverse();
    const oldestReachEntry =
      howTheVideoWasReached.slice().shift() || youTubeNavigationMetadata;

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
        <div className="panel-section-separator" />

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
            <div className="col-span-2 row-span-3 px-0">
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
                        {youTubeNavigationMetadata.video_metadata.video_title}
                      </h4>
                      <p className="mt-1 font-hairline text-sm text-grey-darker text-sm overflow-y-auto h-5">
                        {
                          youTubeNavigationMetadata.video_metadata
                            .view_count_at_navigation_short
                        }{" "}
                        ·{" "}
                        {
                          youTubeNavigationMetadata.video_metadata
                            .video_posting_date
                        }
                      </p>
                    </div>
                    <div>
                      <label className="label-bold">
                        How you arrived at this video:
                      </label>
                      <ul className="list-breadcrumb my-2 text-sm overflow-y-auto h-48">
                        <li className="inline">
                          {
                            youTubePageEntryPointLabels[
                              oldestReachEntry.page_entry_point
                            ]
                          }
                        </li>
                        {howTheVideoWasReached.map(
                          (
                            youTubeVisitMetadata: YouTubeNavigationMetadata,
                            index: number,
                          ) => (
                            <React.Fragment key={index}>
                              {(youTubeVisitMetadata.video_metadata && (
                                <li
                                  className="inline"
                                  title={
                                    youTubeVisitMetadata.video_metadata
                                      .video_title
                                  }
                                >
                                  <img
                                    className="h-4 inline"
                                    src={`https://img.youtube.com/vi/${youTubeVisitMetadata.video_metadata.video_id}/default.jpg`}
                                    alt=""
                                  />
                                </li>
                              )) || (
                                <li className="inline">
                                  {
                                    youTubeNavigationUrlTypeLabels[
                                      youTubeVisitMetadata.url_type
                                    ]
                                  }
                                </li>
                              )}
                            </React.Fragment>
                          ),
                        )}
                        <li
                          className="inline"
                          title={
                            youTubeNavigationMetadata.video_metadata.video_title
                          }
                        >
                          This Video
                        </li>
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
                        Tell us why you regret watching this content{" "}
                        <MdHelp
                          className="inline text-grey-50 align-middle"
                          title="The categories below were the most commonly reported by users in a previous YouTube Regrets study; if your report falls into a different category, please indicate that in the “Other” field."
                        />
                      </span>
                    </p>
                    <ul className="list-none">
                      {[
                        {
                          value: "false",
                          label: "False",
                        },
                        {
                          value: "offensive",
                          label: "Offensive",
                        },
                        {
                          value: "bizarre",
                          label: "Bizarre",
                        },
                      ].map(item => (
                        <li key={item.value} className="mb-2">
                          <Checkbox
                            name="user_supplied_regret_categories"
                            value={item.value}
                            label={item.label}
                            checked={
                              this.state.userSuppliedRegretCategories.indexOf(
                                item.value,
                              ) > -1
                            }
                            onChange={this.handleChange}
                          />
                        </li>
                      ))}
                      <li className="mb-2">
                        <Checkbox
                          name="user_supplied_regret_categories"
                          value="other"
                          label="Other: "
                          checked={
                            this.state.userSuppliedRegretCategories.indexOf(
                              "other",
                            ) > -1
                          }
                          onChange={this.handleChange}
                        />
                        <Input
                          className="input__field w-full my-3"
                          id="user_supplied_other_regret_category"
                          name="user_supplied_other_regret_category"
                          placeholder=""
                          disabled={
                            this.state.userSuppliedRegretCategories.indexOf(
                              "other",
                            ) === -1
                          }
                          value={this.state.userSuppliedOtherRegretCategory}
                          onChange={this.handleChange}
                        />
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-span-3 px-0">
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
                        onClick={async (q, n) => {
                          await this.setState({ userSuppliedSeverity: n });
                          return this.persistFormState();
                        }}
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
                      id="user_supplied_optional_comment"
                      name="user_supplied_optional_comment"
                      placeholder=""
                      label="Will you tell us more about why you regret watching the
                        video? (Optional)"
                      value={this.state.userSuppliedOptionalComment}
                      onChange={this.handleChange}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="panel-section-separator" />

        <div className="panel-section panel-section-formElements">
          <ul className="flex flex-col md:flex-row items-start items-center justify-between">
            <li>
              Your report is shared with Mozilla according to our{" "}
              <Link
                className="inline"
                target="_blank"
                href={config.privacyNoticeUrl}
              >
                Privacy Notice
              </Link>
              . <br />
              More information:{" "}
              <Link
                className="inline"
                target="_blank"
                href={browser.runtime.getURL(`get-started/get-started.html`)}
              >
                RegretReporter Instructions
              </Link>
            </li>
            <li>
              <a
                href={config.feedbackSurveyUrl}
                rel="noreferrer noopener"
                target="_blank"
                className="inline feedback-link"
              >
                {" "}
                Feedback
              </a>
              {/*
            </li>
            <li className="m-2">
              <a
                className="link inline"
                target="_blank"
                href="./report-regret-form.html?skipWindowAndTabIdFilter=1"
              >
                Debug
              </a>
            */}
            </li>
          </ul>
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
