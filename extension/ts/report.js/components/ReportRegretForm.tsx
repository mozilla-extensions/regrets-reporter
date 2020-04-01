import React, { MouseEvent } from "react";
import "photon-colors/photon-colors.css";
import "./photon-components-web/index.css";
import "./photon-components-web/attributes";
import Input from "./photon-components-web/photon-components/Input";
import Radio from "./photon-components-web/photon-components/Radio";
import Checkbox from "./photon-components-web/photon-components/Checkbox";
import Link from "./photon-components-web/photon-components/Link";
import { browser, Runtime } from "webextension-polyfill-ts";
import Port = Runtime.Port;
import { YouTubeNavigation } from "../../background.js/ReportSummarizer";

export interface ReportRegretFormProps {}

interface VideoMetadata {
  thumb_url: string;
  title: string;
  description: string;
  posting_date: string;
  view_count_short: string;
}

export interface ReportRegretFormState {
  loading: boolean;
  videoMetadata: null | VideoMetadata;
  reportData: any;
  userSuppliedRegretCategory: string;
  userSuppliedOptionalComment: string;
  includeWatchHistory: boolean;
}

export class ReportRegretForm extends React.Component<
  ReportRegretFormProps,
  ReportRegretFormState
> {
  public state = {
    loading: true,
    videoMetadata: null,
    reportData: null,
    userSuppliedRegretCategory: "",
    userSuppliedOptionalComment: "",
    includeWatchHistory: true,
  };

  private backgroundContextPort: Port;

  componentDidMount(): void {
    // console.log("Connecting to the background script");
    this.backgroundContextPort = browser.runtime.connect(browser.runtime.id, {
      name: "port-from-report-form",
    });

    // Send a request to gather the report data
    this.backgroundContextPort.postMessage({
      requestReportData: true,
    });

    // When we have received report data, update state that summarizes it
    this.backgroundContextPort.onMessage.addListener(
      (m: { reportData: { youTubeNavigation: YouTubeNavigation } }) => {
        if (m.reportData) {
          console.log({ m });
          const { reportData } = m;
          const videoMetadata: VideoMetadata = {
            thumb_url: `https://img.youtube.com/vi/${reportData.youTubeNavigation.video_id}/mqdefault.jpg`,
            title: reportData.youTubeNavigation.video_title,
            description: reportData.youTubeNavigation.video_description,
            posting_date: reportData.youTubeNavigation.video_posting_date,
            view_count_short:
              reportData.youTubeNavigation.view_count_at_navigation_short,
          };
          this.setState({
            reportData,
            videoMetadata,
            loading: false,
          });
        }
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
    this.backgroundContextPort.postMessage({
      reportedRegret: {
        reportData: this.state.reportData,
        userSuppliedRegretCategory: this.state.userSuppliedRegretCategory,
        userSuppliedOptionalComment: this.state.userSuppliedOptionalComment,
        includeWatchHistory: this.state.includeWatchHistory,
      },
    });
    window.close();
  };

  handleUserSuppliedRegretCategoryOptionChange = changeEvent => {
    console.log({ changeEvent });
    this.setState({
      userSuppliedRegretCategory: changeEvent.target.value,
    });
  };

  render() {
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
        */}

        <div className="panel-section panel-section-formElements">
          <div className="panel-formElements-item">
            <strong>I regret watching this video:</strong>
          </div>
        </div>

        <div className="panel-section-separator" />

        <div className="px-0">
          <div className="flex -mx-0">
            <div className="w-1/2 px-0">
              <div className="panel-section panel-section-formElements">
                <div className="panel-formElements-item">
                  {!this.state.loading && this.state.videoMetadata && (
                    <div className="flex-1 mr-1">
                      <div>
                        <img
                          className="w-full"
                          src={this.state.videoMetadata.thumb_url}
                          alt=""
                        />
                      </div>
                      <div className="mb-0 mt-1">
                        <h4 className="text-sm font-medium">
                          {this.state.videoMetadata.title}
                        </h4>
                        <p className="mt-1 font-hairline text-xs text-grey-darker">
                          {this.state.videoMetadata.view_count_short} ·{" "}
                          {this.state.videoMetadata.posting_date}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="w-1/2 px-0">
              <div className="panel-section panel-section-formElements">
                <div className="panel-formElements-item mb-6">
                  <div>
                    <p>
                      <span className="input__label mb-3">
                        Why do you regret watching the video?
                        {/*How were your recommendations affected?*/}
                      </span>
                    </p>
                    <ul className="list-none">
                      <li className="mb-2">
                        <Radio
                          name="user_supplied_regret_category"
                          value="conspiracy-theory"
                          label="Conspiracy theory"
                          checked={
                            this.state.userSuppliedRegretCategory ===
                            "conspiracy-theory"
                          }
                          onChange={
                            this.handleUserSuppliedRegretCategoryOptionChange
                          }
                        />
                      </li>
                      <li className="mb-2">
                        <Radio
                          name="user_supplied_regret_category"
                          value="hate-speech"
                          label="Hate speech"
                          checked={
                            this.state.userSuppliedRegretCategory ===
                            "hate-speech"
                          }
                          onChange={
                            this.handleUserSuppliedRegretCategoryOptionChange
                          }
                        />
                      </li>
                      <li className="mb-2">
                        <Radio
                          name="user_supplied_regret_category"
                          value="misinformation"
                          label="Misinformation"
                          checked={
                            this.state.userSuppliedRegretCategory ===
                            "misinformation"
                          }
                          onChange={
                            this.handleUserSuppliedRegretCategoryOptionChange
                          }
                        />
                      </li>
                      <li className="mb-2">
                        <Radio
                          name="user_supplied_regret_category"
                          value="violence"
                          label="Violence"
                          checked={
                            this.state.userSuppliedRegretCategory === "violence"
                          }
                          onChange={
                            this.handleUserSuppliedRegretCategoryOptionChange
                          }
                        />
                      </li>
                      <li className="mb-2">
                        <Radio
                          name="user_supplied_regret_category"
                          value="other"
                          label="Other"
                          checked={
                            this.state.userSuppliedRegretCategory === "other"
                          }
                          onChange={
                            this.handleUserSuppliedRegretCategoryOptionChange
                          }
                        />
                      </li>
                    </ul>
                  </div>
                </div>
                {/*
                <div class="panel-formElements-item">
                  <label for="category">Category:</label>
                  <select id="category">
                    <option value="" selected="selected">Choose</option>
                    <option value="conspiracy-theory">Conspiracy theory</option>
                    <option value="hate-speech">Hate speech</option>
                    <option value="misinformation">Misinformation</option>
                    <option value="violence">Violence</option>
                  </select>
                </div>
                */}
                <div className="panel-formElements-item mb-8">
                  <div className="w-full">
                    {/*
                    <label for="user_supplied_comment" class="input__label mb-3" style="text-align: left;">How were your recommendations affected?</label>
                    */}
                    <label
                      htmlFor="user_supplied_comment"
                      className="input__label mb-3 align-left"
                      style={{ textAlign: "left" }}
                    >
                      Comment (optional)
                    </label>
                    <Input
                      className="input__field w-full"
                      id="user_supplied_comment"
                      name="user_supplied_comment"
                      placeholder=""
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
          <div className="panel-formElements-item mb-6">
            <span>
              <Checkbox
                label="Include recent watch history in the report (helps researchers figure out why you were recommended this video)"
                onChange={() => {
                  this.setState({
                    includeWatchHistory: !this.state.includeWatchHistory,
                  });
                }}
                checked={this.state.includeWatchHistory}
              />
            </span>
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
              href="https://foundation.mozilla.org/en/campaigns/youtube-regrets/"
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
