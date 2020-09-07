import React from "react";
import { SharedDataEventMetadata } from "../background.js/DataSharer";

export interface EventMetadataColumns {
  event_metadata_event_uuid: string;
  event_metadata_client_timestamp: Date;
  event_metadata_extension_installation_uuid: string;
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
    key: "event_metadata_extension_version",
    name: "Extension Version",
    width: 200,
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
