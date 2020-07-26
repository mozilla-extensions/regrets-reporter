import React, { useState, useCallback, useMemo } from "react";
import { AutoSizer } from "react-virtualized";
import DataGrid, {
  SelectColumn,
  Column,
  RowsUpdateEvent,
  SortDirection,
} from "react-data-grid";
import { ClickToViewFormatter } from "./ClickToViewFormatter";
import "react-data-grid/dist/react-data-grid.css";
import { AnnotatedSharedData } from "../background.js/DataSharer";
import {
  EmptyRowsRenderer,
  eventMetadataColumns,
  EventMetadataColumns,
  flattenEventMetadata,
  SummaryRow,
} from "./common";
import { RegretReportData } from "../background.js/ReportSummarizer";

interface Row extends EventMetadataColumns {
  form_step: number;
  report_data: RegretReportData;
  user_supplied_regret_categories: string[];
  user_supplied_other_regret_category: string;
  user_supplied_severity: number;
  user_supplied_optional_comment: string;
}

const columns: readonly Column<Row, SummaryRow>[] = [
  SelectColumn,
  {
    key: "form_step",
    name: "Form Step",
    width: 150,
    editable: false,
    resizable: true,
    sortable: true,
  },
  {
    key: "report_data",
    name: "Report Data",
    width: 100,
    editable: false,
    resizable: true,
    sortable: true,
    formatter: ({ row }) => {
      return (
        <>
          <ClickToViewFormatter
            openNode={
              <div className="my-2 py-1 px-2 rounded bg-grey-20 hover:bg-grey-30 text-sm leading-tight">
                Click to show
              </div>
            }
            closeNode={
              <div className="my-2 py-1 px-2 rounded bg-grey-20 hover:bg-grey-30 text-sm leading-tight">
                Close
              </div>
            }
            cellContents={<pre>{JSON.stringify(row.report_data, null, 2)}</pre>}
          />
        </>
      );
    },
  },
  {
    key: "user_supplied_regret_categories",
    name: "user_supplied_regret_categories",
    width: 250,
    editable: false,
    resizable: true,
    sortable: true,
    formatter: ({ row }) => {
      return <>{row.user_supplied_regret_categories.join(", ")}</>;
    },
  },
  {
    key: "user_supplied_other_regret_category",
    name: "user_supplied_other_regret_category",
    width: 250,
    editable: false,
    resizable: true,
    sortable: true,
  },
  {
    key: "user_supplied_severity",
    name: "user_supplied_severity",
    width: 250,
    editable: false,
    resizable: true,
    sortable: true,
  },
  {
    key: "user_supplied_optional_comment",
    name: "user_supplied_optional_comment",
    width: 250,
    editable: false,
    resizable: true,
    sortable: true,
  },
  ...eventMetadataColumns,
];

function createRows(
  regretReportEntries: AnnotatedSharedData[],
): readonly Row[] {
  const rows: Row[] = regretReportEntries.map(regretReportEntry => {
    return {
      form_step: regretReportEntry.regret_report.form_step,
      report_data: regretReportEntry.regret_report.report_data,
      user_supplied_optional_comment:
        regretReportEntry.regret_report.user_supplied_optional_comment,
      user_supplied_other_regret_category:
        regretReportEntry.regret_report.user_supplied_other_regret_category,
      user_supplied_regret_categories:
        regretReportEntry.regret_report.user_supplied_regret_categories,
      user_supplied_severity:
        regretReportEntry.regret_report.user_supplied_severity,
      ...flattenEventMetadata(regretReportEntry.event_metadata),
    };
  });

  /*
  "regret_report": {
      "form_step": 1,
      "report_data": {
        "parent_youtube_navigations_metadata": [
          ...
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
