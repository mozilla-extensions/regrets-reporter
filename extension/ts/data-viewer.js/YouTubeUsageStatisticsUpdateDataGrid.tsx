import React, { useState, useCallback, useMemo } from "react";
import { AutoSizer } from "react-virtualized";
import DataGrid, {
  SelectColumn,
  Column,
  RowsUpdateEvent,
  SortDirection,
} from "react-data-grid";
import "react-data-grid/dist/react-data-grid.css";
import semver from "semver";
import { AnnotatedSharedData } from "../background.js/DataSharer";
import {
  EmptyRowsRenderer,
  eventMetadataColumns,
  EventMetadataColumns,
  flattenEventMetadata,
  SummaryRow,
} from "./common";
import { YouTubeUsageStatisticsUpdate } from "../background.js/YouTubeUsageStatistics";
import { ClickToViewFormatter } from "./ClickToViewFormatter";

interface Row extends EventMetadataColumns {
  youtube_usage_statistics_update: YouTubeUsageStatisticsUpdate;
}

const columns: readonly Column<Row, SummaryRow>[] = [
  SelectColumn,
  {
    key: "youtube_usage_statistics_update",
    name: "YouTube Usage Statistics Update",
    width: 250,
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
            cellContents={
              <pre>
                {JSON.stringify(row.youtube_usage_statistics_update, null, 2)}
              </pre>
            }
          />
        </>
      );
    },
  },
  ...eventMetadataColumns,
];

function createRows(
  regretReportEntries: AnnotatedSharedData[],
): readonly Row[] {
  const rows: Row[] = regretReportEntries.map(regretReportEntry => {
    return {
      youtube_usage_statistics_update:
        regretReportEntry.youtube_usage_statistics_update,
      ...flattenEventMetadata(regretReportEntry.event_metadata),
    };
  });

  /*
  "youtube_usage_statistics_update": {
      "amount_of_days_of_at_least_one_video_played_on_a_youtube_watch_page": {
        "in_total": 0,
        "via_non_search_algorithmic_recommendations_content": 0,
        "via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for": 0,
        "via_search_results": 0
      },
      "amount_of_days_with_at_least_one_youtube_visit": 0,
      "amount_of_days_with_at_least_one_youtube_watch_page_load": {
        "in_total": 0,
        "via_non_search_algorithmic_recommendations_content": 0,
        "via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for": 0,
        "via_search_results": 0
      },
      "amount_of_time_with_an_active_youtube_tab": 0,
      "amount_of_time_with_an_active_youtube_watch_page_tab": {
        "in_total": 0,
        "via_non_search_algorithmic_recommendations_content": 0,
        "via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for": 0,
        "via_search_results": 0
      },
      "amount_of_youtube_video_play_time": 0,
      "amount_of_youtube_video_play_time_on_youtube_watch_pages": {
        "in_total": 0,
        "via_non_search_algorithmic_recommendations_content": 0,
        "via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for": 0,
        "via_search_results": 0
      },
      "amount_of_youtube_videos_played_on_youtube_watch_pages": {
        "in_total": 0,
        "via_non_search_algorithmic_recommendations_content": 0,
        "via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for": 0,
        "via_search_results": 0
      },
      "amount_of_youtube_watch_pages_loaded": {
        "in_total": 0,
        "via_non_search_algorithmic_recommendations_content": 0,
        "via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for": 0,
        "via_search_results": 0
      }
    }
*/

  for (let i = 0; i < 1000; i++) {
    rows.push();
  }

  return rows;
}

export function YouTubeUsageStatisticsUpdateDataGrid({
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
        case "event_metadata_extension_version":
          sortedRows = sortedRows.sort((a, b) =>
            semver.gt(a[sortColumn], b[sortColumn]),
          );
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
