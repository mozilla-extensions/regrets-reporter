import React, { MouseEvent } from "react";
import "photon-colors/photon-colors.css";
import "./photon-components-web/index.css";
import "./photon-components-web/attributes";
import Input from "./photon-components-web/photon-components/Input";
import Radio from "./photon-components-web/photon-components/Radio";
import Checkbox from "./photon-components-web/photon-components/Checkbox";
import Link from "./photon-components-web/photon-components/Link";

export interface ReportRegretFormProps {}

export interface ReportRegretFormState {
  includeWatchHistory: boolean;
}

export class ReportRegretForm extends React.Component<
  ReportRegretFormProps,
  ReportRegretFormState
> {
  public state = {
    includeWatchHistory: true,
  };
  cancel(event: MouseEvent) {
    event.preventDefault();
    window.close();
  }
  report(event: MouseEvent) {
    event.preventDefault();
    console.log("TODO");
  }
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
                  <div className="flex-1 mr-1">
                    <div>
                      <img
                        className="w-full"
                        src="./images/yt_sample_thumb.jpg"
                        alt=""
                      />
                    </div>
                    <div className="mb-0 mt-1">
                      <h4 className="text-sm font-medium">
                        Commit editor settings to version control? - Fun Fun
                        Function
                      </h4>
                      <p className="mt-1 font-hairline text-xs text-grey-darker">
                        5.3K views · 4 days ago
                      </p>
                    </div>
                  </div>
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
                        />
                      </li>
                      <li className="mb-2">
                        <Radio
                          name="user_supplied_regret_category"
                          value="hate-speech"
                          label="Hate speech"
                        />
                      </li>
                      <li className="mb-2">
                        <Radio
                          name="user_supplied_regret_category"
                          value="misinformation"
                          label="Misinformation"
                        />
                      </li>
                      <li className="mb-2">
                        <Radio
                          name="user_supplied_regret_category"
                          value="violence"
                          label="Violence"
                        />
                      </li>
                      <li className="mb-2">
                        <Radio
                          name="user_supplied_regret_category"
                          value="other"
                          label="Other"
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
                      placeholder="This is a placeholder"
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
                onChange={ch => {
                  console.log({ ch });
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
              href="./report_regret.html"
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
