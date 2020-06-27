
# Request for data collection review form

**All questions are mandatory. You must receive review from a data steward peer on your responses to these questions before shipping new data collection.**

1) What questions will you answer with this data?

   1. What videos are being reported as regrettable?
   2. What categories does reported regrettable content fall under? (Specified in the table answer to question 5 below)
   3. Are there identifiable patterns in terms of frequency or severity of reported regrettable content?
   4. Are there specific YouTube usage patterns that lead to encountering and reporting regrettable content?
   5. Is the reported rate of regrettable experiences greater for non-search algorithmic recommendations content (watch-next, or sidebar recommendations, homepage links, etc) as compared to search results? (This would provide some evidence to argue that the excessive optimization for implicit feedback is amplifying harmful content. This is because in the case of search, there is an explicit query to optimize for whereas non-search recommendations can only rely on other feedback)
   6. How do the metrics differ across users from a particular geography (e.g. the EU) (Relevant when we are developing reports for the policymaker audience)
   7. What is the frequency of reported regrettable experiences on YouTube by each YouTube usage metric that we collect? (Specified in the table answer to question 5 below)
   8. Does the report frequency increase for users after they send their first report, (possibly indicating that they are encountering more regrettable content)?
   9. Does the rate of reports within a particular category of content or severity of regret increase after an initial report?
   10. What are the qualitative characteristics of the YouTube Regrets and the recent watch history preceding the reports? Are there identifiable patterns?

2) Why does Mozilla need to answer these questions?  Are there benefits for users? Do we need this information to address product or business requirements? Some example responses:

As part of the Mozilla Foundation’s ongoing advocacy work to push for transparency and accountability in algorithmic content recommendation systems, we are building a browser extension that gives users the opportunity to donate data to us about their “YouTube Regrets”. This project specifically aligns with Mozilla Foundation OKR 3.3 “25k people share information with us (stories, browsing data, etc.) in order to gather evidence about how AI currently works and what changes are needed” which supports our overall objective of mobilising consumer audiences to pressure companies to make ‘consumer AI’ more trustworthy.

This browser extension will enable us to conduct research into what kind of AI/ML-powered content recommendations users find to be harmful and use that research to raise awareness and make recommendations on how companies can make content recommendations more trustworthy. Our conclusions about the entry points for regrettable content as well as the categories of regrettable content can be useful to employees at YouTube working to reduce recommendations of harmful content (a publicly stated goal of YouTube). Our conclusions about the rates of regrettable content and the qualitative characteristics of video pathways will be useful to journalists who are raising public awareness about these problems. All of our conclusions can also be helpful in informing evidence-based policymaking in jurisdictions where content responsibility is currently a regulatory concern. By drawing specific attention to the mechanisms by which content is amplified and pushing for greater transparency within those (a vision of procedural accountability), we can ensure regulatory scrutiny is focused on the most problematic practices (for more information, see [https://wrongbutuseful.com/2019/10/11/unintended-consequences-amplifying-harmful-content/](https://wrongbutuseful.com/2019/10/11/unintended-consequences-amplifying-harmful-content/)) and we can provide a better alternative to regressive regulatory outcomes (such as increased liability and content control obligations that impact on fundamental rights and smaller companies’ ability to compete). Overall our goal is for our research to benefit users by improving the trustworthiness of content recommendations on YouTube and other platforms.

3) What alternative methods did you consider to answer these questions? Why were they not sufficient?

In September/October 2019 Mozilla Foundation conducted qualitative user research addressing some of these questions. We collected ~1500 anecdotal stories from YouTube users about content recommendations that they self-identified as being harmful or “regrettable”. We published [a curated set of 28 of these stories in October 2019](https://foundation.mozilla.org/en/campaigns/youtube-regrets/) and are currently analysing this same dataset to develop a typology of perceived recommendation failures.

This research gave us a great starting point to refine the research questions of significance to a wider community of stakeholders concerned with the development of trustworthy content recommendation systems, including civil society actors, industry partners and regulatory/oversight bodies. We want to now broaden the scope of our research to collect data that will help us produce more authoritative and specific research on this topic.

As a result of our advocacy efforts we have also talked with YouTube about using their API or other methods to make data available that could be used to answer these questions and those posed by other social science researchers. To date YouTube has not implemented data retrieval mechanisms in line with our requests.

4) Can current instrumentation answer these questions?

No.

It is important to note here that there have been several projects which attempt to analyse and audit YouTube recommender systems<sup>[1]</sup>. Most of these projects come from academia, civil society or industry researchers and involve replicating, simulating or tracking YouTube recommendations using research accounts and/or scraping methods. These projects are limited in their ability to draw conclusions about the role that personalisation plays in determining content recommendations as well as studying user perception of recommended content. While similar in scope, our research differs significantly from these projects in that we focus on content that is self-identified and categorised by users as being “regrettable” rather than developing our own methodology for this.

_[1] Related projects_

- AlgoTransparency: [https://algotransparency.org/](https://algotransparency.org/) scrapes recommendations from list of pre-defined channels to aggregate data about recommendations in specific geographies and/or on specific topics. Looks at nonsubscribed (e.g. not personalised) recommendations using headless browsing in incognito mode
- YouTube Tracking Exposed: [https://youtube.tracking.exposed/](https://youtube.tracking.exposed/) uses scraping approach similar to the above + has a browser extension that gives insight into personalisation. They’ve done some initial studies that prove nonsubscribed recommendations look totally different from subscribed and along specific topic areas as well (e.g. [political videos](https://youtube.tracking.exposed/data/)) but the results are limited.
- Quartz tool: Browser extension that will collect data about YT ads and recommendations, but at the moment they’re focused more on the ads piece. The goal is to uncover what political ads are running alongside which videos on YT with a heavy focus on reporting on YT political influence in the context of the 2020 US elections. Not sure if the tool has been released yet but have just checked in with the creator about this.
- Research on “[auditing YT recommendation pathways](https://arxiv.org/abs/1908.08313)” to see whether YT recommends increasingly extreme content to users— doesn’t take personalisation into account and focused on politically radicalising content as a proxy for “extreme” content
- [More research](https://www.dropbox.com/s/tu547cp0q5m7sd9/YouTube_Audit_CSCW.pdf?dl=0) (**this isn’t public yet so don’t share) **on auditing YT recommendations to test whether or not the ‘filter bubble’ effect is actually real. Looks at whether or not demographic/geographic features have an influence on what videos people are recommended through search on specific topics. Also looks at the influence that watch history has on what people are recommended and when there are demonstrable changes in the behaviour of the recommendation engines depending on topic (so can we identify what topics YT has built their ‘borderline content’ classifier to identify) and finds interesting results for vaccine misinformation.
- [Pure ML paper ](https://dl.acm.org/doi/10.1145/3298689.3346997)written by folks at Google about how YT recommendations work.
- Tubes and Bubbles paper - [https://cmb-css.github.io/bubbletube/](https://cmb-css.github.io/bubbletube/code.html) \

5) List all proposed measurements and indicate the category of data collection for each measurement, using the [Firefox data collection categories](https://wiki.mozilla.org/Firefox/Data_Collection) found on the Mozilla wiki.

<table>
    <tr>
        <td><strong>Measurement Description</strong></td>
        <td><strong>Data Collection Category</strong></td>
        <td><strong>How it is shared</strong></td>
        <td><strong>Supports answering which question?</strong></td>
    </tr>
    <tr>
        <td>Video metadata (The video ID, title, description, posting date, view count at navigation)</td>
        <td>Category 3 (Web activity data)</td>
        <td>Active (Shared via a form)</td>
        <td>
            <ul>
                <li>What videos are being reported as regrettable?
                <li>What categories does reported regrettable content fall under?</li>
            </ul>
        </td>
    </tr>
    <tr>
        <td>URL Type (What kind of YouTube page that was visited (e.g. Video Page, Homepage, or Search results)</td>
        <td>Category 3 (Web activity data)</td>
        <td>Active (Shared via a form)</td>
        <td>
            <ul>
                <li>What are the qualitative characteristics of the YouTube Regrets and the recent watch history
                    preceding the reports? Are there identifiable patterns?
                <li>Are there specific YouTube usage patterns that lead to encountering and reporting regrettable
                    content?
                </li>
            </ul>
        </td>
    </tr>
    <tr>
        <td>Video element play time</td>
        <td>Category 3 (Web activity data)</td>
        <td>Active (Shared via a form)</td>
        <td>
            <ul>
                <li>Are there specific YouTube usage patterns that lead to encountering and reporting regrettable
                    content?
                </li>
            </ul>
        </td>
    </tr>
    <tr>
        <td>Document visible time</td>
        <td>Category 3 (Web activity data)</td>
        <td>Active (Shared via a form)</td>
        <td>
            <ul>
                <li>Are there specific YouTube usage patterns that lead to encountering and reporting regrettable
                    content?
                </li>
            </ul>
        </td>
    </tr>
    <tr>
        <td>Page entry point (Up next,<p>Homepage, Search results page, User page, Channel page, Direct navigation,
            Other, etc)</td>
        <td>Category 3 (Web activity data)</td>
        <td>Active (Shared via a form)</td>
        <td>
            <ul>
                <li>What is the distribution of entry points for regrettable content (e.g. Up Next, Homepage, Search
                    recommendations or direct URL)?
                <li>What is the frequency of reported regrettable experiences on YouTube by each YouTube usage metric
                    that we collect (days with at least one YouTube visit, amount of video pages loaded, time with a
                    YouTube tab being active)?
                </li>
            </ul>
        </td>
    </tr>
    <tr>
        <td>Via search results (True/False)</td>
        <td>Category 3 (Web activity data)</td>
        <td>Passive & Active (included in all shared events)</td>
        <td>
            <ul>
                <li>Is the reported rate of regrettable experiences greater for non-search algorithmic recommendations
                    content (watch-next, or sidebar recommendations, homepage links, etc) as compared to search results?
                </li>
            </ul>
        </td>
    </tr>
    <tr>
        <td>Via non-search algorithmic recommendations content (True/False)</td>
        <td>Category 3 (Web activity data)</td>
        <td>Passive & Active (included in all shared events)</td>
        <td>
            <ul>
                <li>Is the reported rate of regrettable experiences greater for non-search algorithmic recommendations
                    content (watch-next, or sidebar recommendations, homepage links, etc) as compared to search results?
                </li>
            </ul>
        </td>
    </tr>
    <tr>
        <td>Via recommendations with an explicit query or constraint to optimize for (True/False)</td>
        <td>Category 3 (Web activity data)</td>
        <td>Passive & Active (included in all shared events)</td>
        <td>
            <ul>
                <li>Is the reported rate of regrettable experiences greater for non-search algorithmic recommendations
                    content (watch-next, or sidebar recommendations, homepage links, etc) as compared to search results?
                </li>
            </ul>
        </td>
    </tr>
    <tr>
        <td>How the video was reached / "How you arrived at this video"<p>(Metadata for up to the past 5 YouTube pages
            visited in the last 5 hours leading up to the initiation of
            the report. This includes URL Type and, for video pages, video metadata, page entry points, document
            visible time and video element play time.)</td>
        <td>Category 3 (Web activity data)</td>
        <td>Active (Shared via a form)</td>
        <td>
            <ul>
                <li>What are the qualitative characteristics of the YouTube Regrets and the recent watch history
                    preceding the reports? Are there identifiable patterns?
                <li>Are there specific YouTube usage patterns that lead to encountering and reporting regrettable
                    content?
                </li>
            </ul>
        </td>
    </tr>
    <tr>
        <td>Report data UUID (A UUID of the summarized report data, for connecting reports sent from different form steps with each other)</td>
        <td>Category 2</td>
        <td>Active (Shared via a form)</td>
        <td>
            <ul>
                <li>(For data payload parsing)</li>
            </ul>
        </td>
    </tr>
    <tr>
        <td>Form Step (From which step in the regret report form this report was sent from)</td>
        <td>Category 2</td>
        <td>Active (Shared via a form)</td>
        <td>
            <ul>
                <li>(For data payload parsing)</li>
            </ul>
        </td>
    </tr>
    <tr>
        <td>User-selected regret categories (false, offensive, bizarre, other)</td>
        <td>Closed-ended multiple-choice survey response.<p>Category 4 (Highly sensitive data)</td>
        <td>Active (Shared via a form)</td>
        <td>
            <ul>
                <li>What categories does reported regrettable content fall under?
                <li>Does the rate of reports within a particular category of content or severity of regret increase
                    after an initial report?
                </li>
            </ul>
        </td>
    </tr>
    <tr>
        <td>User-selected other regret category</td>
        <td>Open-ended survey response.<p>Category 4 (Highly sensitive data)</td>
        <td>Active (Shared via a form)</td>
        <td>
            <ul>
                <li>What categories does reported regrettable content fall under?
                <li>Does the rate of reports within a particular category of content or severity of regret increase
                    after an initial report?
                <li>What are the qualitative characteristics of the YouTube Regrets? Are there identifiable patterns?
                </li>
            </ul>
        </td>
    </tr>
    <tr>
        <td>User-selected severity rating</td>
        <td>Closed-ended survey response.<p>Category 4 (Highly sensitive data)</td>
        <td>Active (Shared via a form)</td>
        <td>
            <ul>
                <li>Are there identifiable patterns in terms of frequency or severity of reported regrettable content?
                <li>Does the rate of reports within a particular category of content or severity of regret increase
                    after an initial report?
                </li>
            </ul>
        </td>
    </tr>
    <tr>
        <td>User-specified optional comment</td>
        <td>Open-ended survey response.<p>Category 4 (Highly sensitive data)</td>
        <td>Active (Shared via a form)</td>
        <td>
            <ul>
                <li>What are the qualitative characteristics of the YouTube Regrets? Are there identifiable patterns?
                </li>
            </ul>
        </td>
    </tr>
    <tr>
        <td>YouTube Usage Statistics:
            <ul>
                <li>Amount of days of at least one YouTube visit
                <li>Amount of time with an active YouTube tab
                <li>Amount of YouTube video (watch) pages loaded
                <li>Amount of days of at least one YouTube video (watch) page loaded
                <li>Amount of time with an active YouTube video (watch) page tab
                <li>Amount of days of at least one video played on a YouTube watch page
                <li>Amount of videos played on YouTube watch pages
                <li>Amount of YouTube video play time
                <li>Amount of YouTube video play time on YouTube watch pages</li>
            </ul>
        </td>
        <td>Category 3 (Web activity data)</td>
        <td>Passive (Shared on each extension load/reload and every 24 hours)</td>
        <td>
            <ul>
                <li>What is the frequency of reported regrettable experiences on YouTube by each YouTube usage metric
                    that we collect (days with at least one YouTube visit, amount of video pages loaded, time with a
                    YouTube tab being active)?
                <li>Are there specific YouTube usage patterns that lead to encountering and reporting regrettable
                    content?
                <li>Is the reported rate of regrettable experiences greater for non-search algorithmic recommendations
                    content (watch-next, or sidebar recommendations, homepage links, etc) as compared to search results?
                </li>
            </ul>
        </td>
    </tr>
    <tr>
        <td>User-identifier (﻿A unique identifier of the user or browser similar to but not the same as the telemetry
            client_id)
        </td>
        <td>Category 3 (Web activity data)</td>
        <td>Passive & Active (included in all shared events)</td>
        <td>
            <ul>
                <li>Does the report frequency increase for users after they send their first report, (indicating that
                    they are encountering more regrettable content)?
                <li>(Also required to serve deletion requests)</li>
            </ul>
        </td>
    </tr>
    <tr>
        <td>Timestamp in client time</td>
        <td>Category 3 (Web activity data)</td>
        <td>Passive & Active (included in all shared events)</td>
        <td>
            <ul>
                <li>Are there patterns in the types of users who are encountering and reporting regrettable content
                    (e.g. demographic patterns, usage patterns)?
                </li>
            </ul>
        </td>
    </tr>
    <tr>
        <td>Event UUIDs</td>
        <td>Category 1 or 2</td>
        <td>Passive & Active (included in all shared events)</td>
        <td>
            <ul>
                <li>(For deduplication of data during data ingestion)</li>
            </ul>
        </td>
    </tr>
    <tr>
        <td>Total amount of regret reports</td>
        <td>Category 1 or 2</td>
        <td>Passive & Active (included in all shared events)</td>
        <td>
            <ul>
                <li>(For sanity-checking data integrity)</li>
            </ul>
        </td>
    </tr>
    <tr>
        <td>Browser info (build id, name, vendor, version)</td>
        <td>Category 1</td>
        <td>Passive & Active (included in all shared events)</td>
        <td>
            <ul>
                <li>(For measuring reach and differences in activity across browser builds)</li>
            </ul>
        </td>
    </tr>
    <tr>
        <td>Extension version</td>
        <td>Category 1</td>
        <td>Passive & Active (included in all shared events)</td>
        <td>
            <ul>
                <li>(For data payload parsing)</li>
            </ul>
        </td>
    </tr>
    <tr>
        <td>Geographic location (via the<a
                href="https://docs.telemetry.mozilla.org/cookbooks/new_ping.html#ingestion-metadata">geocoding of the IP
            of the client that submitted the telemetry</a>)
        </td>
        <td>Category 2?</td>
        <td>Passive & Active (included in all shared events)</td>
        <td>
            <ul>
                <li>How do the metrics differ across users from a particular geography (e.g. the EU) (Relevant when we
                    are developing reports for the policymaker audience)
                </li>
            </ul>
        </td>
    </tr>
    <tr>
        <td>The answer to “What would you like to give us feedback about?” + the actual feedback</td>
        <td>Category 4</td>
        <td>Active (Shared via a survey)</td>
        <td>
            <ul>
                <li>(To improve the extension and the project in general)</li>
            </ul>
        </td>
    </tr>
</table>

(None of the measurements have specific tracking bugs, so that column has been left out)

For implementation details, see [YouTube Regret Reporter: Data Collection Technical Details](https://docs.google.com/spreadsheets/d/1kU0LnNeNYo4HDsJGMoSi_Mw8UCA_aquWYR4Momi_cNM/edit#gid=0)

The telemetry schema is found at [https://github.com/mozilla-extensions/regrets-reporter/blob/master/extension/telemetry-schema/regrets-reporter-update.1.schema.json](https://github.com/mozilla-extensions/regrets-reporter/blob/master/extension/telemetry-schema/regrets-reporter-update.1.schema.json)

6) How long will this data be collected?  Choose one of the following:

- I want this data to be collected for 6 months initially (potentially renewable).

7) What populations will you measure?

- Which release channels?
  - All release channels (up to the user that installs the add-on from AMO)
- Which countries?
  - The extension is geography agnostic but will only be available in English. We will focus promotion efforts on North America and possibly Western Europe.
- Which locales?
  - All are eligible, but the add-on is only in English
- Any other filters? Please describe in detail below.
  - We will put the extension on AMO, promote it to Mozilla Foundation supporters via our email list and social accounts (Twitter, Instagram, possibly Linked) use paid advertising to promote the extension to new audiences (likely through Twitter and YouTube).
  - This will be initially only available as an add-on for Firefox and thus will only work on desktop devices.
  - The add-on includes a question after installing the add-on "Are you at least 18 years old?" with a Yes/No option, only the Yes-option allows one to continue \

8) If this data collection is default on, what is the opt-out mechanism for users?

This data collection is opt-in, since it requires installation of the add-on. Opt-out is possible by uninstalling the Extension, a process which is described on the instructions page shown after installation.

How we will deal with deletion requests are described in [the extension’s privacy notice](https://docs.google.com/document/d/11-aYXlKRg9LmZKrc2UdJt-afUoY6aoBw4bpBVVqd8Sk/edit#heading=h.ej8jv68zdg4w).

9) Please provide a general description of how you will analyze this data.

Primary analysis will involve calculating regret rates with appropriate confidence intervals. A regret rate will be the number of reported regrets divided by an appropriate denominator, such as the total videos watched, days of YouTube use or active YouTube tab dwell time. These are described in the Metrics table below. We will calculate these rates for various segments, for example, regional (based on geocoded telemetry submission IP data) regret rates, regret rates per entry point (for example, regret rate for recommendations), regret rates for higher- or lower-intensity YouTube users, and the distribution of regret types. These are described in the Segments table below. As well as regret rates, the distribution of regret severity will be analyzed in each segment. We will also use hypothesis testing to identify statistically significant differences in rates between segments.

We will also conduct longitudinal analysis of regrets, for example, comparing regret rates and severity before and after an initial regret report (of course pre-initial-report the regret rate will be zero, but if enough videos are watched in this period, we can calculate an upper limit on the likely rate during that period and compare it to the post-report rate).

We will also perform qualitative analysis of regret comments and categorizations, coding the qualitative data as necessary to answer the research questions.

Metrics:

- Amount of days of at least one YouTube visit
- Amount of time with an active YouTube tab
- Amount of YouTube video (watch) pages loaded
- Amount of days of at least one YouTube video (watch) page loaded
- Amount of time with an active YouTube video (watch) page tab
- Amount of days of at least one video played on a YouTube watch page
- Amount of videos played on YouTube watch pages
- Amount of YouTube video play time
- Amount of YouTube video play time on YouTube watch pages

Segments:

<table>
  <tr>
   <td>Geographical regions
   </td>
   <td>(Country, City <a href="https://docs.telemetry.mozilla.org/cookbooks/new_ping.html#ingestion-metadata">based on telemetry IP</a>)
   </td>
  </tr>
  <tr>
   <td>Video entry-point / Recommendation type
   </td>
   <td>(“Via search results”, “Via non-search algorithmic recommendations content”, “Via recommendations with an explicit query or constraint to optimize for”)
   </td>
  </tr>
</table>

10) Where do you intend to share the results of your analysis?

We plan to communicate the results of our research through mini-briefings specifically tailored to the following audiences: general public/users, journalists, policymakers and YouTube/Google employees. These findings will be available online on Mozilla Foundation web properties, shared with specific audiences via email and we will potentially organise webinars/presentations for specific audiences to go more in depth on our research and analysis. \

11) Is there a third-party tool (i.e. not Telemetry) that you are proposing to use for this data collection? If so:

Yes, we include an optional feedback survey via SurveyGizmo ([screenshots available here](https://docs.google.com/document/d/11-aYXlKRg9LmZKrc2UdJt-afUoY6aoBw4bpBVVqd8Sk/edit#heading=h.hxdq5pf0ouf5)), accessed by clicking on a feedback button in the extension UI. This feedback survey allows users to report an issue, request a feature or submit some other comment.

* Are you using that on the Mozilla backend? Or going directly to the third-party?

Directly to the third-party.
