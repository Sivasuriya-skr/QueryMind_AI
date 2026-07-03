import { useMemo } from 'react';
import './AnalysisPanel.css';

const TABS = [
  { key: 'explain', label: 'Explain' },
  { key: 'optimize', label: 'Optimize' },
  { key: 'plan', label: 'Execution Plan' },
];

function ExplainPanel({ explanation }) {
  if (!explanation) return null;
  const paragraphs = explanation.split('\n').filter(Boolean);
  return (
    <div className="analysis-panel-content">
      {paragraphs.map((p, i) => (
        <p key={i} className="analysis-paragraph">{p}</p>
      ))}
    </div>
  );
}

function OptimizePanel({ suggestions, onApplySuggestion }) {
  if (!suggestions || suggestions.length === 0) {
    return <div className="analysis-panel-empty">No suggestions available.</div>;
  }

  return (
    <div className="analysis-panel-content">
      {suggestions.map((s, i) => (
        <div key={i} className="suggestion-card">
          <div className="suggestion-title">{s.title}</div>
          <div className="suggestion-description">{s.description}</div>
          {s.suggestedSql && (
            <div className="suggestion-sql">
              <pre>{s.suggestedSql}</pre>
              {onApplySuggestion && (
                <button
                  className="suggestion-apply-btn"
                  onClick={() => onApplySuggestion(s.suggestedSql)}
                >
                  Apply to editor
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function PlanPanel({ rawPlan, aiInterpretation }) {
  const columns = useMemo(() => {
    if (!rawPlan || rawPlan.length === 0) return [];
    return Object.keys(rawPlan[0]);
  }, [rawPlan]);

  if (!rawPlan || rawPlan.length === 0) {
    return <div className="analysis-panel-empty">No plan data available.</div>;
  }

  const isJsonPlan = columns.length === 1 && columns[0] === 'EXPLAIN';

  return (
    <div className="analysis-panel-content">
      <div className="plan-subsection">
        <h4 className="plan-subsection-title">Raw Plan</h4>
        {isJsonPlan ? (
          <pre className="plan-json">{rawPlan[0].EXPLAIN}</pre>
        ) : (
          <div className="plan-table-wrapper">
            <table className="plan-table">
              <thead>
                <tr>
                  {columns.map((col) => (
                    <th key={col}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rawPlan.map((row, ri) => (
                  <tr key={ri}>
                    {columns.map((col) => (
                      <td key={col}>{String(row[col] ?? '')}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {aiInterpretation && (
        <div className="plan-subsection">
          <h4 className="plan-subsection-title">AI Interpretation</h4>
          <div className="plan-interpretation">
            {aiInterpretation.split('\n').filter(Boolean).map((line, i) => (
              <p key={i} className="analysis-paragraph">{line}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AnalysisPanel({
  activeTab,
  onTabChange,
  explainResult,
  optimizeResult,
  planResult,
  onApplySuggestion,
  loading,
}) {
  return (
    <div className="analysis-panel">
      <div className="analysis-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`analysis-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => onTabChange(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="analysis-body">
        {loading && (
          <div className="analysis-loading">
            <div className="analysis-spinner" />
            Analyzing...
          </div>
        )}

        {!loading && activeTab === 'explain' && (
          <ExplainPanel explanation={explainResult?.explanation} />
        )}

        {!loading && activeTab === 'optimize' && (
          <OptimizePanel
            suggestions={optimizeResult?.suggestions}
            onApplySuggestion={onApplySuggestion}
          />
        )}

        {!loading && activeTab === 'plan' && (
          <PlanPanel
            rawPlan={planResult?.rawPlan}
            aiInterpretation={planResult?.aiInterpretation}
          />
        )}
      </div>
    </div>
  );
}

export default AnalysisPanel;
