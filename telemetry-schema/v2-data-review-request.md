
# **Request for data collection review form**

**All questions are mandatory. You must receive review from a data steward peer on your responses to these questions before shipping new data collection.**



1. What questions will you answer with this data?

Quantitative Questions

1. How effective are YouTube’s negative feedback mechanisms in:
    1. Reducing recommendation of undesired content?
    2. Reducing recommend	ation of harmful content?
2. What is the relative effectiveness of different negative feedback mechanisms (such as “dislikes” or “not interested”) in the above.
3. Is an alternative YouTube design in which we add a new UI element to encourage users to submit feedback effective in increasing the rate of feedback submission compared to YouTube’s production design?

Qualitative Questions

1. What kind of control would YouTube Regrets Reporter users like to have over their video recommendations?
2. How do YouTube users believe their video recommendations work?
3. What steps do YouTube users take to control their video recommendations?
4. How effective do they feel those user controls are? Do they believe their video recommendations change after they have taken action?
5. How easy is it for YouTube users to find information about how the algorithm works, or why they are seeing a particular recommended video?
6. Does an alternate design improve user perceptions of control and the frequency with which the controls are used?
7. What pieces of information do YouTube users want to know about how the recommendation algorithm works? How would they act on that information?
8. What kind of alternative feedback mechanisms or tools do YouTube users say they want?



2. Why does Mozilla need to answer these questions? Are there benefits for users? Do we need this information to address product or business requirements?


The problems with YouTube’s video recommendation algorithm have been well-documented by researchers, most recently by Mozilla as part of its [YouTube Regrets campaign](https://foundation.mozilla.org/en/campaigns/youtube-regrets/) and its [RegretsReporter add-on](https://foundation.mozilla.org/en/campaigns/regrets-reporter/).

YouTube [tells users](https://www.youtube.com/intl/en_us/howyoutubeworks/product-features/recommendations/#controls) they can manage their recommendations and search results through [the feedback mechanisms YouTube offers](https://support.google.com/youtube/answer/6342839). However, [a walkthrough analysis of YouTube conducted by Simply Secure](https://docs.google.com/presentation/d/1e-1-TSMDMafwISdveolE53sHBavK62b0HNVyMhIdVHY/edit#slide=id.p) suggests that these mechanisms are not easy to find. What’s more, the stories surfaced through [Mozilla’s Regrets campaign](https://docs.google.com/spreadsheets/d/1pNEsfLD2_Qs2-37pJuLfYPf4iOx-dAQlH9J31kSJKHI/edit#gid=462354463), as well as [Brandi’s unpublished investigations](https://docs.google.com/spreadsheets/d/1C89mAV40e7InN_kXdpVkocfXqY20cljln8mzyPnPRwU), suggest that YouTube’s user control mechanisms are not effective.  This is a serious failure and respecting user control is a fundamental principle of trustworthy AI.

Further, given [evidence](https://foundation.mozilla.org/en/campaigns/youtube-regrets/) that users are exposed to harmful content through recommendations, the ability for users to control and manage those recommendations is elevated to critical importance. YouTube also frequently tries to shirk responsibility for harmful content recommendations by touting their user controls and concern for user satisfaction. By evaluating whether these mechanisms are truly effective, we can strengthen our overall assessment (and influence the assessment of others) about whether YouTube's efforts to curb harmful content and deliver users a safe, satisfying experience are sufficient.

In this study, we seek to evaluate the effectiveness of these mechanisms for real users, by leveraging our community of YouTube Regrets Reporter users, with a robust experimental design to produce clear evidence.

Additionally, this experiment will allow us to evaluate whether an alternative design encourages users to submit feedback more frequently compared to YouTube’s production design.  YouTube may use the scarcity of feedback submissions to justify limited respect for those submissions, but we aim to demonstrate that the rate of submissions is something that can be designed for and that YouTube has not chosen to encourage users to submit feedback.

As part of this investigation, we will be surveying users around their expectations and experiences of user control on YouTube, and conducting semi-structured interviews with several of the respondents.

Finally, we see this project as an opportunity to communicate with our community of Regrets Reporter users, re-engaging them and offering additional user value (assistance in issuing feedback), the opportunity to participate in new research, and perhaps thanking them for their support so far and sharing the initial findings that they contributed to. \


If the project confirms our hypothesis, the findings will demonstrate that YouTube is not respecting user agency, an essential component of trustworthy AI.  Demonstrating this deficiency may be leveraged to move public opinion towards greater distrust of YouTube’s intent (and that of the broader industry) and may be useful evidence to demonstrate the need for stronger regulation.

Additionally, the findings would strengthen those of the existing Regrets Reporter findings, making clear that not only is YouTube recommending harmful content, but that they are providing no effective way to prevent such recommendations.

This research will support Mozilla Advocacy objectives to (1) Put pressure on YouTube to improve its recommendation algorithm; and (2) Develop clear indicators for what meaningful algorithmic transparency and user control look like.  This will support OKR 1 of the [Org-wide OKRs](https://wiki.mozilla.org/Foundation/2021/OKRs)


1. What alternative methods did you consider to answer these questions? Why were they not sufficient?

Due to YouTube’s unwillingness to provide needed data for research, options are limited.  Informal small-scale investigations by the advocacy team have suggested that the user control tools are ineffective, but this is inadequate evidence to base a campaign off of to pressure YouTube to improve their behaviour and encourage legislators to require greater transparency.



2. Can current instrumentation answer these questions?

No.  This requires an experimental design that is able to modify the YouTube user experience, submit user control feedback on the user’s behalf, and collect data on what recommendations are being made to each user.



3. List all proposed measurements and indicate the category of data collection for each measurement, using the[ Firefox data collection categories](https://wiki.mozilla.org/Data_Collection) found on the Mozilla wiki.


**Note that the data steward reviewing your request will characterize your data collection based on the highest (and most sensitive) category.**


<table>
  <tr>
   <td>Measurement Description
   </td>
   <td>Data Collection Category
   </td>
   <td>Tracking Bug #
   </td>
  </tr>
  <tr>
   <td>Survey responses including optional email address
   </td>
   <td>Category 4 “Highly sensitive or clearly identifiable personal data”
   </td>
   <td>
   </td>
  </tr>
  <tr>
   <td>Timestamped event indicating a YouTube video is viewed as well as total number of unique videos watched since extension installation.
   </td>
   <td>Category 2 “Interaction data”
   </td>
   <td>
   </td>
  </tr>
  <tr>
   <td>Timestamped event indicating interaction with a use control UI element on the YouTube page, including:
<ul>

<li>Which UI element

<li>For which video: 
<ul>
 
<li>Video ID
 
<li>Video Title
 
<li>Channel/Author
 
<li>Duration
 
<li>Video Description
 
<li>Video Posting Date
 
<li>View Count at Feedback Time
 
<li>User control feedback type
 
<li>Entry Type - categories TBD, but includes:  
<ul>
  
<li>Autoplay
  
<li>Right panel on watch page
  
<li>Search
</li>  
</ul>
</li>  
</ul>

<li>What type of feedback was sent (not strictly necessary, as it can be inferred from experiment arm and UI element, but perhaps a nice sanity check.)
</li>
</ul>
   </td>
   <td>Category 3 (Web activity data)
   </td>
   <td>
   </td>
  </tr>
  <tr>
   <td>For all recommendations presented to the user:
<ul>

<li>Video ID

<li>Video Title

<li>Channel/Author

<li>Duration

<li>Video Description

<li>Video Posting Date

<li>View Count at Recommendation Time

<li>Recommendation Type - categories TBD, but includes: 
<ul>
 
<li>Autoplay
 
<li>Right panel on watch page
</li> 
</ul>
</li> 
</ul>
   </td>
   <td>Category 3 (Web activity data)
   </td>
   <td>
   </td>
  </tr>
  <tr>
   <td>Randomized experiment arm assignment, which is constant for a given installation
   </td>
   <td>Category 1 “Technical data”
   </td>
   <td>
   </td>
  </tr>
  <tr>
   <td>User identifier (installation ID)
   </td>
   <td>Category 1 “Technical data”
   </td>
   <td>
   </td>
  </tr>
  <tr>
   <td>User country from GeoIP
   </td>
   <td>Category 1 “Technical data”
   </td>
   <td>
   </td>
  </tr>
  <tr>
   <td>Extension version
   </td>
   <td>Category 1 “Technical data”
   </td>
   <td>
   </td>
  </tr>
  <tr>
   <td>Sentry error reporting
   </td>
   <td>Category 1 “Technical data”
   </td>
   <td>
   </td>
  </tr>
</table>


1. Please provide a link to the documentation for this data collection which describes the ultimate data set in a public, complete, and accurate way.

v2-schema.yaml in this directory.

1. How long will this data be collected? Choose one of the following:
* I want this data to be collected for 6 months initially (potentially renewable).

1. What populations will you measure?
* Which release channels?
    * All release channels (up to the user that installs the add-on from AMO)
* Which countries?
    * All countries, although the extension will only be available in English.
* Which locales?
    * All are eligible, but the add-on is only in English
* Any other filters? Please describe in detail below.
    * We will put the extension on AMO and the Chrome Web Store, promote it to Mozilla Foundation supporters via our email list and social accounts (Twitter, Instagram, possibly Linked) use paid advertising to promote the extension to new audiences (likely through Twitter and YouTube).
    * This will be initially only available as an add-on for Firefox and Chrome and thus will only work on desktop devices.
    * The add-on includes a question after installing the add-on "Are you at least 18 years old?" with a Yes/No option, only the Yes-option allows one to continue

1. If this data collection is default on, what is the opt-out mechanism for users?

This data collection is opt-in, since it requires installation of the add-on. Opt-out is possible by uninstalling the Extension, a process which is described on the instructions page shown after installation.

How we will deal with deletion requests are described in[ the extension’s privacy notice](https://docs.google.com/document/d/11-aYXlKRg9LmZKrc2UdJt-afUoY6aoBw4bpBVVqd8Sk/edit#heading=h.ej8jv68zdg4w). \


2. Please provide a general description of how you will analyze this data. \

There are three primary analyses:

**Effectiveness of user feedback**

For each user, we will establish a set of videos for which negative feedback was issued (negative videos) and a set of videos which were recommended to that user (reccomended videos).  We will perform comparisons between these sets, both including all recommended videos with all negative videos for which the negative video timestamp is before the recommended video timestamp, and also restricting that the difference betwee the timestamps is less than a window length to explore whether the impact of feedback decays over time.

The comparison will be made by evaluating the relatedness of the negative videos with the recommended videos.  We will perform exploratory analysis to develop an appropriate analysis which will include heuristics (common phrases between video titles or descriptions, etc.), manual review by us and research assistants, and potentially statistical models if feasible.

We will then be able to calculate an approximate rate of recommendation of videos related to negative videos for each user.  This will be aggregated by experiment arm, allowing computation of the effectiveness of the various user control mechanisms.

**Impact of alternative design on use of user feedback tools**

We will calculate the rate of use of user feedback tools both per video watched, per unique video watched, and per day.  This will be compared between experiment arms with and without the modified UX.

**Qualitative analysis**

We will perform a content analysis of the qualitative survey responses, in which we will categorize and tag the survey responses. The coding will combine inductive and deductive approaches: We will start with a tentative set of codes that reflect the kinds of responses we anticipate receiving, but the codebook will ultimately be developed from the kinds of responses we receive. We plan to use a hierarchical coding frame to assign codes based on how they relate to one another. We will also use a narrative analysis in order to tease out the story behind the responses. 

After coding the survey responses, we’ll query the data to determine the most prominent codes or themes, the relationship between responses, and to identify specific anecdotes in which emergent user behaviors surfaced in response to a lack of control/information.



3. Where do you intend to share the results of your analysis?

We plan to communicate the results of our research through mini-briefings specifically tailored to the following audiences: general public/users, journalists, policymakers and YouTube/Google employees. These findings will be available online on Mozilla Foundation web properties, shared with specific audiences via email and we will potentially organise webinars/presentations for specific audiences to go more in depth on our research and analysis. \




4. Is there a third-party tool (i.e. not Telemetry) that you are proposing to use for this data collection? If so:

Yes the research includes a survey that will be run through SurveyGizmo



* Are you using that on the Mozilla backend? Or going directly to the third-party?

Directly to the third-party.



1. **What is/are the risk(s) associated with this data collection? **

    _Completed by Office of CTO, Security, Privacy, Trust._


<table>
  <tr>
   <td>
<strong>#</strong>
   </td>
   <td><strong>Risk</strong>
   </td>
   <td><strong>Likelihood</strong>
   </td>
   <td><strong>Recommendation</strong>
   </td>
   <td><strong>Near-term Response/Mitigation</strong>
   </td>
   <td><strong>Future consideration</strong>
   </td>
  </tr>
  <tr>
   <td><strong>1</strong>
   </td>
   <td>User identifier/installation ID linked to Email address
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>Email address will only be stored with survey data.  Survey data including email address will be accessible only to qualitative analysts and they will not have access to telemetry data.
   </td>
   <td>
   </td>
  </tr>
  <tr>
   <td><strong>2</strong>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
  </tr>
  <tr>
   <td><strong>3</strong>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
  </tr>
</table>
