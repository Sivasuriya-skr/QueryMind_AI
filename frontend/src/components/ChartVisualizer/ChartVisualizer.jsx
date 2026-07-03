import { useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import './ChartVisualizer.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const COLORS = [
  '#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16',
  '#a855f7', '#e11d48', '#0ea5e9', '#d946ef', '#22c55e',
];

function isNumeric(value) {
  if (value == null || value === '') return null;
  const num = Number(value);
  return !Number.isNaN(num) ? num : null;
}

function isLikelyDate(value) {
  if (typeof value !== 'string') return false;
  return /^\d{4}[-\/]\d{1,2}[-\/]\d{1,2}/.test(value) || /\d{1,2}[-\/]\d{1,2}[-\/]\d{4}/.test(value);
}

function inferColumnTypes(columns, rows) {
  if (!rows.length) {
    return columns.map((c) => ({ name: c, type: 'string' }));
  }

  const sampleSize = Math.min(rows.length, 100);
  return columns.map((col) => {
    let numericCount = 0;
    let nonNullCount = 0;

    for (let i = 0; i < sampleSize; i++) {
      const val = rows[i][col];
      if (val == null || val === '') continue;
      nonNullCount++;
      if (isNumeric(val) !== null) numericCount++;
    }

    const type =
      nonNullCount > 0 && numericCount / nonNullCount >= 0.8
        ? 'numeric'
        : isLikelyDate(rows[0]?.[col])
        ? 'date'
        : 'string';
    return { name: col, type };
  });
}

function ChartVisualizer({ columns, rows }) {
  const [showChart, setShowChart] = useState(false);
  const [chartType, setChartType] = useState('bar');
  const [labelCol, setLabelCol] = useState('');
  const [valueCol, setValueCol] = useState('');

  const columnTypes = useMemo(
    () => inferColumnTypes(columns, rows),
    [columns, rows]
  );

  const numericColumns = useMemo(
    () => columnTypes.filter((c) => c.type === 'numeric').map((c) => c.name),
    [columnTypes]
  );

  const labelCandidates = useMemo(
    () =>
      columnTypes
        .filter((c) => c.type !== 'numeric')
        .map((c) => c.name),
    [columnTypes]
  );

  const isChartable = useMemo(
    () => numericColumns.length >= 1 && labelCandidates.length >= 1 && rows.length > 1,
    [numericColumns, labelCandidates, rows]
  );

  const effectiveLabel = labelCol || labelCandidates[0] || '';
  const effectiveValue = valueCol || numericColumns[0] || '';

  const chartData = useMemo(() => {
    if (!showChart || !effectiveLabel || !effectiveValue) return null;

    let labels = rows.map((r) => {
      const v = r[effectiveLabel];
      return v != null ? String(v) : '';
    });

    let values = rows.map((r) => {
      const v = isNumeric(r[effectiveValue]);
      return v !== null ? v : 0;
    });

    const totals = {};
    labels.forEach((label, i) => {
      totals[label] = (totals[label] || 0) + values[i];
    });

    const uniqueLabels = Object.keys(totals);
    const uniqueValues = uniqueLabels.map((l) => totals[l]);
    const colorSlice = uniqueLabels.map((_, i) => COLORS[i % COLORS.length]);

    return {
      labels: uniqueLabels,
      datasets: [
        {
          label: effectiveValue,
          data: uniqueValues,
          backgroundColor:
            chartType === 'line'
              ? COLORS[0]
              : chartType === 'pie'
              ? colorSlice
              : colorSlice,
          borderColor: COLORS[0],
          borderWidth: chartType === 'line' ? 2 : 1,
          tension: 0.3,
        },
      ],
    };
  }, [showChart, effectiveLabel, effectiveValue, rows, chartType]);

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: chartType !== 'bar' && chartType !== 'line' },
        tooltip: { mode: 'index', intersect: false },
      },
      scales:
        chartType !== 'pie'
          ? {
              x: { title: { display: true, text: effectiveLabel } },
              y: { title: { display: true, text: effectiveValue }, beginAtZero: true },
            }
          : undefined,
    }),
    [chartType, effectiveLabel, effectiveValue]
  );

  if (!isChartable) return null;

  const ChartComponent = chartType === 'bar' ? Bar : chartType === 'pie' ? Pie : Line;

  return (
    <div className="cv-wrapper">
      <div className="cv-toggle-bar">
        <button
          className={`cv-toggle-btn ${showChart ? 'active' : ''}`}
          onClick={() => setShowChart((prev) => !prev)}
        >
          {showChart ? 'Hide Chart' : 'Visualize'}
        </button>

        {showChart && (
          <div className="cv-controls">
            <label>
              Chart
              <select value={chartType} onChange={(e) => setChartType(e.target.value)}>
                <option value="bar">Bar</option>
                <option value="pie">Pie</option>
                <option value="line">Line</option>
              </select>
            </label>
            <label>
              Label
              <select value={effectiveLabel} onChange={(e) => setLabelCol(e.target.value)}>
                {labelCandidates.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
            <label>
              Value
              <select value={effectiveValue} onChange={(e) => setValueCol(e.target.value)}>
                {numericColumns.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
          </div>
        )}
      </div>

      {showChart && chartData && (
        <div className="cv-chart-container">
          <ChartComponent data={chartData} options={options} />
        </div>
      )}
    </div>
  );
}

export default ChartVisualizer;
