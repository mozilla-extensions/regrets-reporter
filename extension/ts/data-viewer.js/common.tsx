import React from "react";
import { SharedDataEventMetadata } from "../background.js/DataSharer";

export interface EventMetadataColumns {
  event_metadata_event_uuid: string;
  event_metadata_client_timestamp: Date;
  event_metadata_extension_installation_uuid: string;
  event_metadata_total_amount_of_regret_reports: number;
  event_metadata_browser_build_id: string;
  event_metadata_browser_vendor: string;
  event_metadata_browser_version: string;
  event_metadata_browser_name: string;
  event_metadata_extension_version: string;
}

export const eventMetadataColumns = [
  {
    key: "event_metadata_event_uuid",
    name: "Entry ID",
    width: 320,
    frozen: true,
    sortable: true,
    summaryFormatter() {
      return <strong>Total</strong>;
    },
  },
  {
    key: "event_metadata_client_timestamp",
    name: "Timestamp",
    width: 160,
    frozen: true,
    resizable: true,
    sortable: true,
    formatter(props) {
      return (
        <TimestampFormatter date={props.row.event_metadata_client_timestamp} />
      );
    },
    summaryFormatter({ row }) {
      return <>{row.totalCount} records</>;
    },
  },
  {
    key: "event_metadata_extension_installation_uuid",
    name: "Extension Installation ID",
    width: 320,
    editable: false,
    resizable: true,
    sortable: true,
  },
  {
    key: "event_metadata_total_amount_of_regret_reports",
    name: "Regret Reports",
    width: 140,
    editable: false,
    resizable: true,
    sortable: true,
  },
  {
    key: "event_metadata_browser_vendor",
    name: "Browser Vendor",
    width: 150,
    editable: false,
    resizable: true,
    sortable: true,
  },
  {
    key: "event_metadata_browser_name",
    name: "Browser Name",
    width: 130,
    editable: false,
    resizable: true,
    sortable: true,
  },
  {
    key: "event_metadata_browser_version",
    name: "Browser Version",
    width: 140,
    editable: false,
    resizable: true,
    sortable: true,
  },
  {
    key: "event_metadata_browser_build_id",
    name: "Browser Build ID",
    width: 150,
    editable: false,
    resizable: true,
    sortable: true,
  },
];

export const flattenEventMetadata = (
  event_metadata: SharedDataEventMetadata,
) => {
  return {
    event_metadata_event_uuid: `${event_metadata.event_uuid}`,
    event_metadata_extension_installation_uuid: `${event_metadata.extension_installation_uuid}`,
    event_metadata_client_timestamp: new Date(event_metadata.client_timestamp),
    event_metadata_total_amount_of_regret_reports:
      event_metadata.total_amount_of_regret_reports,
    event_metadata_browser_build_id: `${event_metadata.browser_info.build_id}`,
    event_metadata_browser_vendor: `${event_metadata.browser_info.vendor}`,
    event_metadata_browser_version: `${event_metadata.browser_info.version}`,
    event_metadata_browser_name: `${event_metadata.browser_info.name}`,
    event_metadata_extension_version: `${event_metadata.extension_version}`,
  };
};

const dateTimeFormatter = new Intl.DateTimeFormat(navigator.language, {
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  second: "numeric",
});

export function TimestampFormatter({ date }: { date: Date }) {
  return <>{dateTimeFormatter.format(date)}</>;
}

export function EmptyRowsRenderer() {
  return <div className="text-center m-5">No data</div>;
}

export interface SummaryRow {
  id: string;
  totalCount: number;
}
