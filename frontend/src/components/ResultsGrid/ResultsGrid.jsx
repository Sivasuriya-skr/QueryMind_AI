import { useMemo, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import ChartVisualizer from '../ChartVisualizer/ChartVisualizer';
import './ResultsGrid.css';

function ResultsGrid({ columns, rows, rowCount, executionTimeMs }) {
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 100;
  const totalPages = Math.max(1, Math.ceil(rowCount / pageSize));

  const colDefs = useMemo(
    () =>
      columns.map((col) => ({
        field: col,
        headerName: col,
        sortable: true,
        filter: true,
        resizable: true,
        wrapHeaderText: true,
        autoHeaderHeight: true,
      })),
    [columns]
  );

  const defaultColDef = useMemo(
    () => ({
      flex: 1,
      minWidth: 100,
      resizable: true,
      filter: true,
      sortable: true,
    }),
    []
  );

  if (!columns.length) {
    return (
      <div className="results-grid-wrapper">
        <div className="results-empty">Query returned no results.</div>
      </div>
    );
  }

  return (
    <div className="results-grid-wrapper">
      <div className="results-info">
        <span>
          <strong>{rowCount.toLocaleString()}</strong> row{rowCount !== 1 ? 's' : ''} returned
          {executionTimeMs != null && (
            <> in <strong>{executionTimeMs}</strong>ms</>
          )}
        </span>
        <span className="results-grid-hint">
          Sort / filter columns using the header menus.
        </span>
      </div>

      <ChartVisualizer columns={columns} rows={rows} />

      <div className="ag-theme-alpine results-grid-container">
        <AgGridReact
          rowData={rows}
          columnDefs={colDefs}
          defaultColDef={defaultColDef}
          pagination={true}
          paginationPageSize={pageSize}
          paginationPageSizeSelector={[50, 100, 200]}
          domLayout="autoHeight"
          suppressCellFocus={true}
          enableCellTextSelection={true}
          onPaginationChanged={(e) => setCurrentPage(e.api?.paginationGetCurrentPage() ?? 0)}
        />
      </div>
    </div>
  );
}

export default ResultsGrid;
