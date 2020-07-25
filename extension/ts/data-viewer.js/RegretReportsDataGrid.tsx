import React, { useState, useCallback, useMemo } from "react";
import { AutoSizer } from "react-virtualized";
import DataGrid, {
  SelectColumn,
  Column,
  RowsUpdateEvent,
  SortDirection,
} from "react-data-grid";
import "react-data-grid/dist/react-data-grid.css";
import { AnnotatedSharedData } from "../background.js/DataSharer";

const dateTimeFormatter = new Intl.DateTimeFormat(navigator.language, {
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  second: "numeric",
});

function TimestampFormatter({ date }: { date: Date }) {
  return <>{dateTimeFormatter.format(date)}</>;
}

function EmptyRowsRenderer() {
  return <div className="text-center m-5">No data</div>;
}

interface SummaryRow {
  id: string;
  totalCount: number;
}

interface Row {
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

const columns: readonly Column<Row, SummaryRow>[] = [
  SelectColumn,
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
    width: 150,
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
    width: 150,
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
    width: 180,
    editable: false,
    resizable: true,
    sortable: true,
  },
];

function createRows(
  regretReportEntries: AnnotatedSharedData[],
): readonly Row[] {
  const rows: Row[] = regretReportEntries.map(regretReportEntry => {
    return {
      event_metadata_event_uuid: `${regretReportEntry.event_metadata.event_uuid}`,
      event_metadata_extension_installation_uuid: `${regretReportEntry.event_metadata.extension_installation_uuid}`,
      event_metadata_client_timestamp: new Date(
        regretReportEntry.event_metadata.client_timestamp,
      ),
      event_metadata_total_amount_of_regret_reports:
        regretReportEntry.event_metadata.total_amount_of_regret_reports,
      event_metadata_browser_build_id: `${regretReportEntry.event_metadata.browser_info.build_id}`,
      event_metadata_browser_vendor: `${regretReportEntry.event_metadata.browser_info.vendor}`,
      event_metadata_browser_version: `${regretReportEntry.event_metadata.browser_info.version}`,
      event_metadata_browser_name: `${regretReportEntry.event_metadata.browser_info.name}`,
      event_metadata_extension_version: `${regretReportEntry.event_metadata.extension_version}`,
    };
  });

  /*
  "regret_report": {
      "form_step": 1,
      "report_data": {
        "parent_youtube_navigations_metadata": [



        ],
        "report_data_uuid": "fe9ddd41-3092-4d6c-976f-099b26b87fe4",
        "youtube_navigation_metadata": {
          "document_visible_time": 0,
          "page_entry_point": "page_reload",
          "url_type": "watch_page",
          "via_non_search_algorithmic_recommendations_content": 0,
          "via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for": 0,
          "via_search_results": 0,
          "video_element_play_time": 0,
          "video_metadata": {
            "video_description": "10 hours of comfortable silence. Only watch the original, everything else may contain sound ;-)",
            "video_id": "g4mHPeMGTJM",
            "video_posting_date": "20 Sep 2011",
            "video_title": "10 hours of absolute silence (the original)",
            "view_count_at_navigation": 4496886,
            "view_count_at_navigation_short": "4.4M views"
          }
        },
      },
      "user_supplied_optional_comment": "",
      "user_supplied_other_regret_category": "",
      "user_supplied_regret_categories": [],
      "user_supplied_severity": -1
    }


   */

  for (let i = 0; i < 1000; i++) {
    rows.push();
  }

  return rows;
}

export function RegretReportsDataGrid({
  regretReportEntries,
}: {
  regretReportEntries: AnnotatedSharedData[];
}) {
  const [rows, setRows] = useState(() => createRows(regretReportEntries));
  const [[sortColumn, sortDirection], setSort] = useState<
    [string, SortDirection]
  >(["event_metadata_event_uuid", "NONE"]);
  const [selectedRows, setSelectedRows] = useState(() => new Set<string>());

  const summaryRows = useMemo(() => {
    const summaryRow: SummaryRow = {
      id: "total_0",
      totalCount: rows.length,
    };
    return [summaryRow];
  }, [rows]);

  const sortedRows: readonly Row[] = useMemo(() => {
    if (sortDirection === "NONE") return rows;

    let sortedRows: Row[] = [...rows];

    try {
      switch (sortColumn) {
        default:
          sortedRows = sortedRows.sort((a, b) =>
            a[sortColumn].localeCompare(b[sortColumn]),
          );
          break;
        case "event_metadata_total_amount_of_regret_reports":
          sortedRows = sortedRows.sort((a, b) => a[sortColumn] - b[sortColumn]);
          break;
        case "event_metadata_client_timestamp":
          sortedRows = sortedRows.sort(
            (a, b) => a[sortColumn].getTime() - b[sortColumn].getTime(),
          );
          break;
      }
    } catch (error) {
      console.log({ sortColumn });
      console.error(error);
    }

    return sortDirection === "DESC" ? sortedRows.reverse() : sortedRows;
  }, [rows, sortDirection, sortColumn]);

  const handleRowsUpdate = useCallback(
    ({ fromRow, toRow, updated }: RowsUpdateEvent<Partial<Row>>) => {
      const newRows = [...sortedRows];

      for (let i = fromRow; i <= toRow; i++) {
        newRows[i] = { ...newRows[i], ...updated };
      }

      setRows(newRows);
    },
    [sortedRows],
  );

  const handleSort = useCallback(
    (columnKey: string, direction: SortDirection) => {
      setSort([columnKey, direction]);
    },
    [],
  );

  return (
    <AutoSizer>
      {({ height, width }) => (
        <DataGrid
          rowKey="event_metadata_event_uuid"
          columns={columns}
          rows={sortedRows}
          width={width}
          height={height}
          selectedRows={selectedRows}
          onSelectedRowsChange={setSelectedRows}
          onRowsUpdate={handleRowsUpdate}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={handleSort}
          summaryRows={summaryRows}
          emptyRowsRenderer={EmptyRowsRenderer}
        />
      )}
    </AutoSizer>
  );
}
