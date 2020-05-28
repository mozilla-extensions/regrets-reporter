import {
  OpenWPMType,
  OpenWpmPayloadEnvelope,
} from "../../NavigationBatchPreprocessor";

export const exampleDotComVisitQueueWithSavedContent: OpenWpmPayloadEnvelope[] = [
  {
    type: "http_requests" as OpenWPMType,
    httpRequest: {
      incognito: 0,
      crawl_id: 0,
      extension_session_uuid: "acdb772e-e86e-4232-b396-0f69c883958b",
      event_ordinal: 80,
      window_id: 3,
      tab_id: 4,
      frame_id: 0,
      request_id: "191",
      url: "http://example.com/",
      method: "GET",
      time_stamp: "2020-03-31T10:13:09.912Z",
      referrer: "",
      headers:
        '[["Host","example.com"],["User-Agent","Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:75.0) Gecko/20100101 Firefox/75.0"],["Accept","text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"],["Accept-Language","en-US,en;q=0.5"],["Accept-Encoding","gzip, deflate"],["Connection","keep-alive"],["Upgrade-Insecure-Requests","1"]]',
      is_XHR: 0,
      triggering_origin: "undefined",
      loading_origin: "undefined",
      loading_href: "undefined",
      resource_type: "main_frame",
      top_level_url: "http://example.com/",
      parent_frame_id: -1,
      frame_ancestors: "[]",
    },
  },
  {
    type: "openwpm_captured_content",
    capturedContent: {
      decoded_content:
        '<!doctype html>\n<html>\n<head>\n    <title>Example Domain</title>\n\n    <meta charset="utf-8" />\n    <meta http-equiv="Content-type" content="text/html; charset=utf-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1" />\n    <style type="text/css">\n    body {\n        background-color: #f0f0f2;\n        margin: 0;\n        padding: 0;\n        font-family: -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", "Open Sans", "Helvetica Neue", Helvetica, Arial, sans-serif;\n        \n    }\n    div {\n        width: 600px;\n        margin: 5em auto;\n        padding: 2em;\n        background-color: #fdfdff;\n        border-radius: 0.5em;\n        box-shadow: 2px 3px 7px 2px rgba(0,0,0,0.02);\n    }\n    a:link, a:visited {\n        color: #38488f;\n        text-decoration: none;\n    }\n    @media (max-width: 700px) {\n        div {\n            margin: 0 auto;\n            width: auto;\n        }\n    }\n    </style>    \n</head>\n\n<body>\n<div>\n    <h1>Example Domain</h1>\n    <p>This domain is for use in illustrative examples in documents. You may use this\n    domain in literature without prior coordination or asking for permission.</p>\n    <p><a href="https://www.iana.org/domains/example">More information...</a></p>\n</div>\n</body>\n</html>\n',
      content_hash:
        "ea8fac7c65fb589b0d53560f5251f74f9e9b243478dcb6b3ea79b5e36449c8d9",
      extension_session_uuid: "acdb772e-e86e-4232-b396-0f69c883958b",
      window_id: 3,
      tab_id: 4,
      frame_id: 0,
      event_ordinal: 81,
      time_stamp: "2020-03-31T10:13:10.640Z",
    },
  },
  {
    type: "http_responses",
    httpResponse: {
      incognito: 0,
      crawl_id: 0,
      extension_session_uuid: "acdb772e-e86e-4232-b396-0f69c883958b",
      event_ordinal: 81,
      window_id: 3,
      tab_id: 4,
      frame_id: 0,
      request_id: "191",
      is_cached: 0,
      url: "http://example.com/",
      method: "GET",
      response_status: 200,
      response_status_text: "HTTP/1.1 200 OK",
      time_stamp: "2020-03-31T10:13:10.640Z",
      headers:
        '[["Content-Encoding","gzip"],["Age","386775"],["Cache-Control","max-age=604800"],["Content-Type","text/html; charset=UTF-8"],["Date","Tue, 31 Mar 2020 10:13:10 GMT"],["Etag","\\"3147526947+gzip\\""],["Expires","Tue, 07 Apr 2020 10:13:10 GMT"],["Last-Modified","Thu, 17 Oct 2019 07:18:26 GMT"],["Server","ECS (nyb/1D1E)"],["Vary","Accept-Encoding"],["X-Cache","HIT"],["Content-Length","648"]]',
      location: "",
      content_hash:
        "ea8fac7c65fb589b0d53560f5251f74f9e9b243478dcb6b3ea79b5e36449c8d9",
    },
  },
  {
    type: "navigations",
    navigation: {
      crawl_id: 0,
      incognito: 0,
      extension_session_uuid: "acdb772e-e86e-4232-b396-0f69c883958b",
      window_id: 3,
      tab_id: 4,
      frame_id: 0,
      window_width: 840,
      window_height: 1027,
      window_type: "normal",
      tab_width: 840,
      tab_height: 953,
      tab_cookie_store_id: "firefox-default",
      uuid: "a1170632-0bf3-459f-9cf3-3211e7101990",
      url: "http://example.com/",
      transition_qualifiers: '["from_address_bar"]',
      transition_type: "typed",
      committed_event_ordinal: 82,
      committed_time_stamp: "2020-03-31T10:13:10.645Z",
      parent_frame_id: -1,
      before_navigate_event_ordinal: 79,
      before_navigate_time_stamp: "2020-03-31T10:13:09.904Z",
    },
  },
  {
    type: "http_requests",
    httpRequest: {
      incognito: 0,
      crawl_id: 0,
      extension_session_uuid: "acdb772e-e86e-4232-b396-0f69c883958b",
      event_ordinal: 83,
      window_id: 3,
      tab_id: 4,
      frame_id: 0,
      request_id: "192",
      url: "http://example.com/favicon.ico",
      method: "GET",
      time_stamp: "2020-03-31T10:13:10.797Z",
      referrer: "",
      headers:
        '[["Host","example.com"],["User-Agent","Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:75.0) Gecko/20100101 Firefox/75.0"],["Accept","image/webp,*/*"],["Accept-Language","en-US,en;q=0.5"],["Accept-Encoding","gzip, deflate"],["Connection","keep-alive"]]',
      is_XHR: 0,
      triggering_origin: "http://example.com",
      loading_origin: "http://example.com",
      loading_href: "http://example.com/",
      resource_type: "image",
      top_level_url: "http://example.com/",
      parent_frame_id: -1,
      frame_ancestors: "[]",
    },
  },
  {
    type: "openwpm_captured_content",
    capturedContent: {
      decoded_content:
        '<!doctype html>\n<html>\n<head>\n    <title>Example Domain</title>\n\n    <meta charset="utf-8" />\n    <meta http-equiv="Content-type" content="text/html; charset=utf-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1" />\n    <style type="text/css">\n    body {\n        background-color: #f0f0f2;\n        margin: 0;\n        padding: 0;\n        font-family: -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", "Open Sans", "Helvetica Neue", Helvetica, Arial, sans-serif;\n        \n    }\n    div {\n        width: 600px;\n        margin: 5em auto;\n        padding: 2em;\n        background-color: #fdfdff;\n        border-radius: 0.5em;\n        box-shadow: 2px 3px 7px 2px rgba(0,0,0,0.02);\n    }\n    a:link, a:visited {\n        color: #38488f;\n        text-decoration: none;\n    }\n    @media (max-width: 700px) {\n        div {\n            margin: 0 auto;\n            width: auto;\n        }\n    }\n    </style>    \n</head>\n\n<body>\n<div>\n    <h1>Example Domain</h1>\n    <p>This domain is for use in illustrative examples in documents. You may use this\n    domain in literature without prior coordination or asking for permission.</p>\n    <p><a href="https://www.iana.org/domains/example">More information...</a></p>\n</div>\n</body>\n</html>\n',
      content_hash:
        "ea8fac7c65fb589b0d53560f5251f74f9e9b243478dcb6b3ea79b5e36449c8d9",
      extension_session_uuid: "acdb772e-e86e-4232-b396-0f69c883958b",
      window_id: 3,
      tab_id: 4,
      frame_id: 0,
      event_ordinal: 84,
      time_stamp: "2020-03-31T10:13:11.073Z",
    },
  },
  {
    type: "http_responses",
    httpResponse: {
      incognito: 0,
      crawl_id: 0,
      extension_session_uuid: "acdb772e-e86e-4232-b396-0f69c883958b",
      event_ordinal: 84,
      window_id: 3,
      tab_id: 4,
      frame_id: 0,
      request_id: "192",
      is_cached: 0,
      url: "http://example.com/favicon.ico",
      method: "GET",
      response_status: 404,
      response_status_text: "HTTP/1.1 404 Not Found",
      time_stamp: "2020-03-31T10:13:11.073Z",
      headers:
        '[["Content-Encoding","gzip"],["Accept-Ranges","bytes"],["Age","450758"],["Cache-Control","max-age=604800"],["Content-Type","text/html; charset=UTF-8"],["Date","Tue, 31 Mar 2020 10:13:10 GMT"],["Expires","Tue, 07 Apr 2020 10:13:10 GMT"],["Last-Modified","Thu, 26 Mar 2020 05:00:32 GMT"],["Server","ECS (nyb/1D25)"],["Vary","Accept-Encoding"],["X-Cache","404-HIT"],["Content-Length","648"]]',
      location: "",
      content_hash:
        "ea8fac7c65fb589b0d53560f5251f74f9e9b243478dcb6b3ea79b5e36449c8d9",
    },
  },
];
