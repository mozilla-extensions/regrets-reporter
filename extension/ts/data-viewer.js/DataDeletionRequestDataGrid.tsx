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
import {
  EmptyRowsRenderer,
  eventMetadataColumns,
  EventMetadataColumns,
  flattenEventMetadata,
  SummaryRow,
} from "./common";

interface Row extends EventMetadataColumns {
  extension_installation_error_reporting_uuid: string;
}

const columns: readonly Column<Row, SummaryRow>[] = [
  SelectColumn,
  {
    key: "extension_installation_error_reporting_uuid",
    name: "Error Reporting ID",
    width: 320,
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
      extension_installation_error_reporting_uuid:
        regretReportEntry.data_deletion_request
          .extension_installation_error_reporting_uuid,
      ...flattenEventMetadata(regretReportEntry.event_metadata),
    };
  });

  for (let i = 0; i < 1000; i++) {
    rows.push();
  }

  return rows;
}

export function DataDeletionRequestDataGrid({
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
