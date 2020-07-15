import * as React from "react";
import { Component, MouseEvent } from "react";
import "photon-colors/photon-colors.css";
import "../shared-resources/photon-components-web/attributes/index.css";
import "../shared-resources/tailwind.css";
import { Input } from "../shared-resources/photon-components-web/photon-components/Input";
import { Checkbox } from "../shared-resources/photon-components-web/photon-components/Checkbox";
import "../shared-resources/photon-components-web/photon-components/Checkbox/light-theme.css";
import { Link } from "../shared-resources/photon-components-web/photon-components/Link";
import { TextArea } from "../shared-resources/photon-components-web/photon-components/TextArea";
import "./ReportRegretForm.css";
import "./index.css";
import { browser, Runtime } from "webextension-polyfill-ts";
import Port = Runtime.Port;
import {
  RegretReport,
  RegretReportData,
  YouTubeNavigationMetadata,
} from "../background.js/ReportSummarizer";
import LikertScale from "likert-react";
import { DisplayError } from "./DisplayError";
import { getCurrentTab } from "../background.js/lib/getCurrentTab";
import { config } from "../config";
import { captureExceptionWithExtras } from "../shared-resources/ErrorReporting";
import { DoorHanger } from "./DoorHanger";
import { TimeLine } from "./TimeLine";
import { TimeLineElement } from "./TimeLineElement";

export interface ReportRegretFormProps {}

export interface ReportRegretFormState {
  loading: boolean;
  videoThumbUrl: null | string;
  regretReportData: null | RegretReportData;
  userSuppliedRegretCategories: string[];
  userSuppliedOtherRegretCategory: string;
  userSuppliedSeverity: number;
  userSuppliedOptionalComment: string;
  formStep: number;
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
    formStep: 1,
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
            formStep,
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
            formStep,
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

  getRegretReportFromState = (): RegretReport => {
    return {
      report_data: this.state.regretReportData,
      user_supplied_regret_categories: this.state.userSuppliedRegretCategories,
      user_supplied_other_regret_category: this.state
        .userSuppliedOtherRegretCategory,
      user_supplied_severity: this.state.userSuppliedSeverity,
      user_supplied_optional_comment: this.state.userSuppliedOptionalComment,
      form_step: this.state.formStep,
    };
  };

  submitStep1 = async (event: MouseEvent) => {
    event.preventDefault();
    const regretReport: RegretReport = this.getRegretReportFromState();
    this.backgroundContextPort.postMessage({
      regretReport,
    });
    // Advance to step 2
    await this.setState({
      formStep: 2,
    });
    return this.persistFormState();
  };

  submitStep2 = async (event: MouseEvent) => {
    event.preventDefault();
    const regretReport: RegretReport = this.getRegretReportFromState();
    this.backgroundContextPort.postMessage({
      regretReport,
    });
    // Reset form state
    const {
      userSuppliedRegretCategories,
      userSuppliedOtherRegretCategory,
      userSuppliedSeverity,
      userSuppliedOptionalComment,
      formStep,
    } = this.defaultFormState;
    await this.setState({
      reported: true,
      userSuppliedRegretCategories,
      userSuppliedOtherRegretCategory,
      userSuppliedSeverity,
      userSuppliedOptionalComment,
      formStep,
    });
    return this.persistFormState();
  };

  skipStep2 = async (event: MouseEvent) => {
    event.preventDefault();
    // Reset form state
    const {
      userSuppliedRegretCategories,
      userSuppliedOtherRegretCategory,
      userSuppliedSeverity,
      userSuppliedOptionalComment,
      formStep,
    } = this.defaultFormState;
    await this.setState({
      reported: true,
      userSuppliedRegretCategories,
      userSuppliedOtherRegretCategory,
      userSuppliedSeverity,
      userSuppliedOptionalComment,
      formStep,
    });
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

  handleUserSuppliedRegretCategoryOptionChange = async changeEvent => {
    const value = changeEvent.target.value;
    const userSuppliedRegretCategories = this.state
      .userSuppliedRegretCategories;
    const index = userSuppliedRegretCategories.indexOf(value);
    const checked = changeEvent.target.checked;
    if (checked) {
      if (index === -1) {
        await this.setState({
          userSuppliedRegretCategories: [
            ...userSuppliedRegretCategories,
            value,
          ],
        });
      }
    } else {
      if (index > -1) {
        userSuppliedRegretCategories.splice(index, 1);
        await this.setState({
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
      formStep,
    } = this.state;
    const videoId = this.state.regretReportData.youtube_navigation_metadata
      .video_metadata.video_id;
    const storageKey = `report-regret-form-state:${videoId}`;
    const stateToPersist = JSON.stringify({
      userSuppliedRegretCategories,
      userSuppliedOtherRegretCategory,
      userSuppliedSeverity,
      userSuppliedOptionalComment,
      formStep,
    });
    localStorage.setItem(storageKey, stateToPersist);
  };

  render() {
    if (this.state.error) {
      return (
        <DisplayError message={`We were unable to show the report form`} />
      );
    }
    if (this.state.loading) {
      return <DoorHanger loading={true} />;
    }
    if (this.state.reported) {
      return (
        <DoorHanger
          title="Mozilla RegretsReporter"
          loading={this.state.loading}
        >
          <div className="p-8 border-b border-grey-30 bg-white">
            <div className="text-lg font-serif font-semibold leading-none mb-5">
              Thank you for your submission.
            </div>
            <div className="text-base">
              If you believe that the content you identified in this submission
              constitutes abuse under YouTube’s policies, please report it
              directly to YouTube via its{" "}
              <a
                className="text-red"
                rel="noreferrer noopener"
                target="_blank"
                href="https://support.google.com/youtube/answer/2802027"
              >
                abuse-reporting platform
              </a>
              .
            </div>
          </div>
          <div className="p-5 bg-white">
            <div className="text-xs">
              Do you have feedback about the RegretsReporter? We would love to
              hear it.{" "}
              <a
                href={config.feedbackSurveyUrl}
                rel="noreferrer noopener"
                target="_blank"
                className="text-red underline"
              >
                Send us feedback
              </a>
              .
            </div>
          </div>
        </DoorHanger>
      );
    }
    const youTubeNavigationMetadata: YouTubeNavigationMetadata = this.state
      .regretReportData.youtube_navigation_metadata;
    const parentYouTubeNavigationsMetadata: YouTubeNavigationMetadata[] = this
      .state.regretReportData.parent_youtube_navigations_metadata;
    const howTheVideoWasReached = parentYouTubeNavigationsMetadata
      .slice()
      .reverse();

    if (this.state.formStep === 1 || !this.state.formStep) {
      return (
        <DoorHanger
          title="Mozilla RegretsReporter"
          loading={this.state.loading}
        >
          <form>
            <div className="px-0">
              <div className="grid grid-cols-13 gap-5 -mx-0">
                <div className="col-span-7 p-5 bg-white">
                  <div className="flex-1">
                    <div className="text-1.5xl font-serif font-bold leading-none mb-3">
                      The video being reported
                    </div>
                    <div>
                      <img
                        className="w-full"
                        src={this.state.videoThumbUrl}
                        alt=""
                      />
                    </div>
                    <div className="mt-4">
                      <h4 className="font-sans text-base truncate h-6 leading-none">
                        {youTubeNavigationMetadata.video_metadata.video_title}
                      </h4>
                      <p className="mt-0 font-sans text-grey-50 text-xs truncate h-4 leading-none">
                        {
                          youTubeNavigationMetadata.video_metadata
                            .view_count_at_navigation_short
                        }{" "}
                        -{" "}
                        {
                          youTubeNavigationMetadata.video_metadata
                            .video_posting_date
                        }
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-span-6 p-5 bg-white flex flex-col">
                  <div className="flex-none text-lg font-serif font-semibold leading-none mb-5">
                    The path that led you here
                  </div>
                  {howTheVideoWasReached.length > 0 && (
                    <TimeLine
                      youTubeNavigationMetadata={youTubeNavigationMetadata}
                      howTheVideoWasReached={howTheVideoWasReached}
                      editable={true}
                      onEdit={() => {}}
                    />
                  )}
                  {howTheVideoWasReached.length === 0 && (
                    <div className="flex-none text-sm">
                      You visited this video directly. There are no other
                      activities to report at this time.
                    </div>
                  )}
                  {howTheVideoWasReached.length === 0 && (
                    <div className="flex-1 img-no-path" />
                  )}
                </div>
              </div>
            </div>

            <div className="mt-2">
              <ul className="flex flex-col md:flex-row items-start items-center justify-between text-xxs leading-relaxed">
                <li>
                  Your report is shared with Mozilla according to our{" "}
                  <Link
                    className="inline text-red"
                    target="_blank"
                    href={config.privacyNoticeUrl}
                  >
                    Privacy Notice
                  </Link>
                  . More information:{" "}
                  <Link
                    className="inline text-red"
                    target="_blank"
                    href={browser.runtime.getURL(
                      `get-started/get-started.html`,
                    )}
                  >
                    RegretReporter Instructions
                  </Link>
                  .
                </li>
              </ul>
            </div>

            <footer className="mt-2">
              <div
                onClick={this.submitStep1}
                className="cursor-pointer leading-doorhanger-footer-button bg-red hover:bg-red-70 text-white font-sans font-semibold py-1 px-5 text-xl text-center"
              >
                Report
              </div>
            </footer>
          </form>
        </DoorHanger>
      );
    }
    if (this.state.formStep === 2) {
      return (
        <DoorHanger
          title="Mozilla RegretsReporter"
          loading={this.state.loading}
        >
          <form>
            <div className="px-0">
              <div className="grid grid-cols-13 gap-5 -mx-0">
                <div className="col-span-7 p-0 bg-white">
                  <div className="uppercase bg-indigo text-white pt-1.5 pb-1 px-2 flex">
                    <span className="flex-none img-check" />
                    <span className="pl-1.5 text-m font-bold">
                      Thank you. Your report has been sent!
                    </span>
                  </div>
                  <div className="p-5">
                    <div className="text-1.5xl font-serif font-bold leading-none">
                      Tell us more about your regret
                    </div>
                    <div className="font-sans text-base mt-2">
                      <div className="mb-2 font-semibold">
                        Why do you regret watching this video?
                      </div>
                      <ul className="list-none">
                        {[
                          {
                            value: "untrue",
                            label: "It was untrue",
                          },
                          {
                            value: "offensive",
                            label: "It was offensive",
                          },
                          {
                            value: "bizarre",
                            label: "It was bizarre",
                          },
                        ].map(item => (
                          <li key={item.value} className="mb-2">
                            <label className="flex">
                              <span className="checkbox__label__text flex">
                                <input
                                  className="checkbox h-4"
                                  type="checkbox"
                                  name="user_supplied_regret_categories"
                                  value={item.value}
                                  checked={
                                    this.state.userSuppliedRegretCategories.indexOf(
                                      item.value,
                                    ) > -1
                                  }
                                  onChange={this.handleChange}
                                />
                                <span className="ml-1 leading-none">
                                  {item.label}
                                </span>
                              </span>
                            </label>
                          </li>
                        ))}
                        <li className="">
                          <label className="flex mb-1">
                            <span className="checkbox__label__text flex">
                              <input
                                className="checkbox h-4"
                                type="checkbox"
                                name="user_supplied_regret_categories"
                                value="other"
                                checked={
                                  this.state.userSuppliedRegretCategories.indexOf(
                                    "other",
                                  ) > -1
                                }
                                onChange={this.handleChange}
                              />
                              <span className="ml-1 leading-none">Other:</span>
                            </span>
                          </label>
                          <label className="input">
                            <input
                              className="input__field w-full mt-1 leading-none border rounded p-1 text-sm border-grey-30 disabled:bg-grey-10"
                              type="text"
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
                          </label>
                        </li>
                      </ul>
                      <div className="font-semibold mt-2 mb-1">
                        How severe is your regret?
                      </div>
                      <div className="inline-flex h-10 w-34 justify-between cursor-pointer">
                        <button
                          onClick={async event => {
                            event.preventDefault();
                            await this.setState({
                              userSuppliedSeverity: 1,
                            });
                            this.persistFormState();
                          }}
                          className={`${
                            this.state.userSuppliedSeverity === 1
                              ? "bg-red hover:bg-red-70 text-white border-red hover:border-red-70"
                              : "bg-white hover:bg-red-transparent text-black"
                          } focus:outline-none rounded-l border border-r-0 px-2 py-1`}
                        >
                          <div
                            className={`${
                              this.state.userSuppliedSeverity === 1
                                ? "invert"
                                : ""
                            } img-icon-face-1`}
                          />
                        </button>
                        <button
                          onClick={async event => {
                            event.preventDefault();
                            await this.setState({
                              userSuppliedSeverity: 2,
                            });
                            this.persistFormState();
                          }}
                          className={`${
                            this.state.userSuppliedSeverity === 2
                              ? "bg-red hover:bg-red-70 text-white border-red hover:border-red-70"
                              : "bg-white hover:bg-red-transparent text-black"
                          } focus:outline-none border border-r-0 px-2 py-1`}
                        >
                          <div
                            className={`${
                              this.state.userSuppliedSeverity === 2
                                ? "invert"
                                : ""
                            } img-icon-face-2`}
                          />
                        </button>
                        <button
                          onClick={async event => {
                            event.preventDefault();
                            await this.setState({
                              userSuppliedSeverity: 3,
                            });
                            this.persistFormState();
                          }}
                          className={`${
                            this.state.userSuppliedSeverity === 3
                              ? "bg-red hover:bg-red-70 text-white border-red hover:border-red-70"
                              : "bg-white hover:bg-red-transparent text-black"
                          } focus:outline-none rounded-r border px-2 py-1`}
                        >
                          <div
                            className={`${
                              this.state.userSuppliedSeverity === 3
                                ? "invert"
                                : ""
                            } img-icon-face-3`}
                          />
                        </button>
                      </div>
                      <div className="font-semibold mt-2">Tell us more:</div>
                      <label className="textarea">
                        <textarea
                          className="w-full form-textarea mt-0 block w-full border p-1 rounded text-sm border-grey-30"
                          rows={2}
                          id="user_supplied_optional_comment"
                          name="user_supplied_optional_comment"
                          placeholder=""
                          onChange={this.handleChange}
                        >
                          {this.state.userSuppliedOptionalComment}
                        </textarea>
                      </label>
                    </div>
                  </div>
                </div>
                <div className="col-span-6 p-5 bg-white flex flex-col">
                  <div className="flex-none text-lg font-serif font-semibold leading-none mb-5">
                    The video and history reported
                  </div>

                  <TimeLineElement
                    youTubeNavigationMetadata={youTubeNavigationMetadata}
                    bold={true}
                    editable={false}
                  />

                  <hr className="my-5 border-grey-20" />

                  {howTheVideoWasReached.length > 0 && (
                    <TimeLine
                      youTubeNavigationMetadata={youTubeNavigationMetadata}
                      howTheVideoWasReached={howTheVideoWasReached}
                      editable={false}
                    />
                  )}
                  {howTheVideoWasReached.length === 0 && (
                    <div className="flex-none text-sm">
                      You visited this video directly.
                    </div>
                  )}
                  {howTheVideoWasReached.length === 0 && (
                    <div className="flex-1 img-no-path" />
                  )}
                </div>
              </div>
            </div>

            <div className="mt-2">
              <ul className="flex flex-col md:flex-row items-start items-center justify-between text-xxs leading-relaxed">
                <li>
                  Your report is shared with Mozilla according to our{" "}
                  <Link
                    className="inline text-red"
                    target="_blank"
                    href={config.privacyNoticeUrl}
                  >
                    Privacy Notice
                  </Link>
                  . More information:{" "}
                  <Link
                    className="inline text-red"
                    target="_blank"
                    href={browser.runtime.getURL(
                      `get-started/get-started.html`,
                    )}
                  >
                    RegretReporter Instructions
                  </Link>
                  .
                </li>
              </ul>
            </div>

            <footer className="mt-2 flex">
              <div
                onClick={this.skipStep2}
                className="w-40 cursor-pointer leading-doorhanger-footer-button border border-red bg-transparent hover:bg-red-transparent text-red font-sans font-semibold py-1 px-5 text-xl text-center"
              >
                Skip
              </div>
              <div
                onClick={this.submitStep2}
                className="flex-1 ml-5 cursor-pointer leading-doorhanger-footer-button bg-red hover:bg-red-70 text-white font-sans font-semibold py-1 px-5 text-xl text-center"
              >
                Send Additional Info
              </div>
            </footer>
          </form>
        </DoorHanger>
      );
    }
  }
}
