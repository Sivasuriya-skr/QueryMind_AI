import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { useConnection } from '../../context/ConnectionContext';
import SqlEditor from '../../components/SqlEditor/SqlEditor';
import ResultsGrid from '../../components/ResultsGrid/ResultsGrid';
import AnalysisPanel from '../../components/AnalysisPanel/AnalysisPanel';
import { format as formatSql } from 'sql-formatter';
import {
  Sparkles,
  Play,
  Info,
  TrendingUp,
  ListTree,
  Code,
  Loader2,
  Database,
  Plus,
  Clock,
  ChevronRight,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import './QueryWorkspace.css';

function highlightSql(sql) {
  if (!sql) return '';
  const keywords = [
    'SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER',
    'CROSS', 'FULL', 'ON', 'AND', 'OR', 'NOT', 'IN', 'AS', 'ORDER BY',
    'GROUP BY', 'HAVING', 'LIMIT', 'OFFSET', 'INSERT', 'INTO', 'VALUES',
    'UPDATE', 'SET', 'DELETE', 'CREATE', 'TABLE', 'ALTER', 'DROP',
    'INDEX', 'DISTINCT', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'BETWEEN',
    'LIKE', 'IS', 'NULL', 'TRUE', 'FALSE', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
    'UNION', 'ALL', 'EXISTS', 'ANY', 'SOME', 'ASC', 'DESC',
  ];
  const regex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'gi');
  return sql.replace(regex, (match) => `<span class="sql-kw">${match}</span>`);
}

function QueryWorkspace() {
  const { activeConnection } = useConnection();
  const navigate = useNavigate();
  const [question, setQuestion] = useState('');
  const [generatedSql, setGeneratedSql] = useState('');
  const [editedSql, setEditedSql] = useState('');
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recentQueries, setRecentQueries] = useState([]);
  const [validationResult, setValidationResult] = useState(null);
  const [executing, setExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);
  const [executionError, setExecutionError] = useState('');
  const [executionErrorType, setExecutionErrorType] = useState('');
  const [analysisActiveTab, setAnalysisActiveTab] = useState('explain');
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState('');
  const [explainResult, setExplainResult] = useState(null);
  const [optimizeResult, setOptimizeResult] = useState(null);
  const [planResult, setPlanResult] = useState(null);
  const [sqlExpanded, setSqlExpanded] = useState(false);
  const resultRef = useRef(null);

  useEffect(() => {
    if (generatedSql && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [generatedSql]);

  useEffect(() => {
    const storedSql = sessionStorage.getItem('reRunSql');
    const storedQuestion = sessionStorage.getItem('reRunQuestion');
    if (storedSql) {
      setEditedSql(storedSql);
      setSqlExpanded(true);
      if (storedQuestion) setQuestion(storedQuestion);
      sessionStorage.removeItem('reRunSql');
      sessionStorage.removeItem('reRunQuestion');
    }
  }, []);

  useEffect(() => {
    setEditedSql(generatedSql);
    setValidationResult(null);
  }, [generatedSql]);

  const handleGenerate = async () => {
    const trimmed = question.trim();
    if (!trimmed) return;
    if (!activeConnection) {
      setError('Select a database connection first (Databases page).');
      return;
    }

    setLoading(true);
    setError('');
    setGeneratedSql('');
    setExplanation('');
    setValidationResult(null);

    try {
      const res = await axiosInstance.post(
        `/connections/${activeConnection.id}/generate-sql`,
        { question: trimmed }
      );
      const { generatedSql: sql, explanation: exp } = res.data;
      setGeneratedSql(sql || '');
      setExplanation(exp || '');

      setRecentQueries((prev) =>
        [{ question: trimmed, sql: sql || '', timestamp: Date.now() }, ...prev].slice(0, 10)
      );
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        (err.response?.status === 500
          ? 'The AI service encountered an error. Check that your database connection is valid.'
          : 'Failed to generate SQL. Please try again.');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async () => {
    if (!editedSql.trim()) return;
    setValidationResult(null);
    setError('');

    try {
      const res = await axiosInstance.post(
        `/connections/${activeConnection.id}/validate-sql`,
        { sql: editedSql }
      );
      setValidationResult(res.data);
    } catch (err) {
      const msg = err.response?.data?.message || 'Validation failed';
      setError(msg);
    }
  };

  const handleRun = useCallback(async () => {
    if (!editedSql.trim()) return;
    setExecuting(true);
    setExecutionResult(null);
    setExecutionError('');
    setExecutionErrorType('');
    setError('');

    try {
      const res = await axiosInstance.post(
        `/connections/${activeConnection.id}/execute-sql`,
        {
          sql: editedSql,
          naturalLanguageQuestion: question || undefined,
          generatedSql: generatedSql || undefined,
        }
      );
      setExecutionResult(res.data);
    } catch (err) {
      const data = err.response?.data;
      const status = err.response?.status;
      const msg = data?.message || data?.reason || 'Query execution failed';
      if (status === 400) {
        setExecutionErrorType('validation');
        setExecutionError(msg);
      } else if (status === 500) {
        setExecutionErrorType('execution');
        setExecutionError(msg);
      } else {
        setExecutionErrorType('connection');
        setExecutionError(msg);
      }
    } finally {
      setExecuting(false);
    }
  }, [editedSql, activeConnection, question, generatedSql]);

  const handleAnalysis = useCallback(async (endpoint, onSuccess) => {
    if (!editedSql.trim()) return;
    setAnalysisLoading(true);
    setAnalysisError('');

    try {
      const res = await axiosInstance.post(
        `/connections/${activeConnection.id}/${endpoint}`,
        { sql: editedSql }
      );
      onSuccess(res.data);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.reason || 'Analysis failed';
      setAnalysisError(msg);
    } finally {
      setAnalysisLoading(false);
    }
  }, [editedSql, activeConnection]);

  const handleExplain = useCallback(() => {
    setAnalysisActiveTab('explain');
    handleAnalysis('explain-sql', setExplainResult);
  }, [handleAnalysis]);

  const handleOptimize = useCallback(() => {
    setAnalysisActiveTab('optimize');
    handleAnalysis('optimize-sql', setOptimizeResult);
  }, [handleAnalysis]);

  const handleExecutionPlan = useCallback(() => {
    setAnalysisActiveTab('plan');
    handleAnalysis('execution-plan', setPlanResult);
  }, [handleAnalysis]);

  const handleApplySuggestion = useCallback((sql) => {
    setEditedSql(sql);
  }, []);

  const clearResults = useCallback(() => {
    setExecutionResult(null);
    setExecutionError('');
    setExecutionErrorType('');
    setExplainResult(null);
    setOptimizeResult(null);
    setPlanResult(null);
    setAnalysisError('');
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleGenerate();
    }
  };

  const handleRecentClick = (item) => {
    setQuestion(item.question);
    setGeneratedSql(item.sql);
    setExplanation('');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(editedSql).catch(() => {});
  };

  if (!activeConnection) {
    return (
      <div className="workspace-page">
        <div className="workspace-bg">
          <div className="workspace-blob workspace-blob-1" />
          <div className="workspace-blob workspace-blob-2" />
          <div className="workspace-blob workspace-blob-3" />
        </div>
        <div className="workspace-content">
          <div className="workspace-empty-card">
            <div className="workspace-empty-icon">
              <Database size={40} />
            </div>
            <p className="workspace-empty-title">No database selected</p>
            <p className="workspace-empty-text">
              Select or add a connection to start querying your data.
            </p>
            <button className="btn-primary" onClick={() => navigate('/connections')}>
              <Plus size={16} />
              Go to Databases
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="workspace-page">
      <div className="workspace-bg">
        <div className="workspace-blob workspace-blob-1" />
        <div className="workspace-blob workspace-blob-2" />
        <div className="workspace-blob workspace-blob-3" />
      </div>

      <div className="workspace-content">
        {/* header */}
        <div className="workspace-header">
          <div>
            <h1>Query Workspace</h1>
            <p className="workspace-subtitle">
              {activeConnection.connectionName}
              <span className="workspace-conn-detail">
                {activeConnection.host}:{activeConnection.port}/{activeConnection.databaseName}
              </span>
            </p>
          </div>
        </div>

        <div className="workspace-layout">
          <div className="workspace-main">
            {/* ASK card */}
            <div className="card ask-card">
              <label className="card-label" htmlFor="nl-question">
                Ask a question in plain English
              </label>
              <textarea
                id="nl-question"
                className="ask-textarea"
                rows={3}
                placeholder="e.g. Show all employees who joined last month"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
              />
              <div className="ask-hint">
                Press Ctrl+Enter or Cmd+Enter to generate
              </div>

              {error && <div className="error-banner">{error}</div>}

              <button
                className="btn-primary btn-generate"
                onClick={handleGenerate}
                disabled={loading || !question.trim()}
              >
                {loading ? (
                  <><Loader2 size={16} className="spin" /> Generating...</>
                ) : (
                  <><Sparkles size={16} /> Generate SQL</>
                )}
              </button>
            </div>

            {/* SQL Editor card */}
            {(generatedSql || editedSql || loading) && (
              <div className="card sql-card" ref={resultRef}>
                <div className="card-header-bar">
                  <span className="card-header-label">
                    <Code size={15} />
                    SQL
                  </span>
                  <div className="card-header-actions">
                    <button
                      className="btn-ghost"
                      onClick={() => {
                        if (!sqlExpanded && editedSql.trim()) {
                          try {
                            setEditedSql(formatSql(editedSql, { language: 'mysql' }));
                          } catch {}
                        }
                        setSqlExpanded((prev) => !prev);
                      }}
                      title={sqlExpanded ? 'Collapse' : 'Format & expand'}
                    >
                      {sqlExpanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                      {sqlExpanded ? 'Collapse' : 'Format'}
                    </button>
                    <button
                      className="btn-ghost"
                      onClick={copyToClipboard}
                      title="Copy SQL"
                    >
                      Copy
                    </button>
                    {validationResult && (
                      <span
                        className={`validation-chip ${validationResult.valid ? 'chip-valid' : 'chip-invalid'}`}
                      >
                        {validationResult.valid ? 'Valid' : 'Invalid'}
                      </span>
                    )}
                  </div>
                </div>

                {loading ? (
                  <div className="sql-skeleton">
                    <div className="skeleton-line" />
                    <div className="skeleton-line" />
                    <div className="skeleton-line short" />
                  </div>
                ) : (
                  <>
                    {sqlExpanded && <SqlEditor value={editedSql} onChange={setEditedSql} />}

                    {!sqlExpanded && editedSql && (
                      <div className="sql-collapsed-preview">
                        <code
                          className="sql-collapsed-code"
                          dangerouslySetInnerHTML={{
                            __html: highlightSql(editedSql),
                          }}
                        />
                      </div>
                    )}

                    {validationResult && !validationResult.valid && (
                      <div className="error-banner" style={{ marginTop: 10 }}>
                        {validationResult.reason}
                      </div>
                    )}

                    {explanation && (
                      <div className="note-banner">
                        <Info size={14} />
                        {explanation}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Action buttons */}
            {(generatedSql || loading) && (
              <div className="actions-row">
                <button
                  className="btn-primary btn-run"
                  onClick={handleRun}
                  disabled={executing || !editedSql.trim()}
                >
                  {executing ? (
                    <><Loader2 size={16} className="spin" /> Running...</>
                  ) : (
                    <><Play size={16} /> Run</>
                  )}
                </button>
                <button
                  className="btn-outline"
                  onClick={handleExplain}
                  disabled={analysisLoading || !editedSql.trim()}
                >
                  {analysisLoading && analysisActiveTab === 'explain' ? (
                    <><Loader2 size={16} className="spin" /> Explain</>
                  ) : (
                    <><Info size={16} /> Explain</>
                  )}
                </button>
                <button
                  className="btn-outline"
                  onClick={handleOptimize}
                  disabled={analysisLoading || !editedSql.trim()}
                >
                  {analysisLoading && analysisActiveTab === 'optimize' ? (
                    <><Loader2 size={16} className="spin" /> Optimize</>
                  ) : (
                    <><TrendingUp size={16} /> Optimize</>
                  )}
                </button>
                <button
                  className="btn-outline"
                  onClick={handleExecutionPlan}
                  disabled={analysisLoading || !editedSql.trim()}
                >
                  {analysisLoading && analysisActiveTab === 'plan' ? (
                    <><Loader2 size={16} className="spin" /> Plan</>
                  ) : (
                    <><ListTree size={16} /> Plan</>
                  )}
                </button>

                {(executionResult || executionError || explainResult || optimizeResult || planResult) && (
                  <button className="btn-ghost btn-clear" onClick={clearResults}>
                    Clear
                  </button>
                )}
              </div>
            )}

            {/* execution error */}
            {executionError && (
              <div className={`error-banner error-${executionErrorType}`}>
                <strong>
                  {executionErrorType === 'validation'
                    ? 'Validation Error'
                    : executionErrorType === 'execution'
                    ? 'Execution Error'
                    : 'Connection Error'}
                </strong>
                : {executionError}
              </div>
            )}

            {/* Results card */}
            {executionResult && (
              <div className="card results-card">
                <div className="card-header-bar">
                  <span className="card-header-label">Results</span>
                  <span className="results-meta">
                    <span className="results-count">{executionResult.rowCount} rows</span>
                    {executionResult.executionTimeMs != null && (
                      <span className={`time-pill time-${executionResult.executionTimeMs < 1000 ? 'fast' : executionResult.executionTimeMs < 5000 ? 'medium' : 'slow'}`}>
                        <Clock size={12} />
                        {executionResult.executionTimeMs}ms
                      </span>
                    )}
                  </span>
                </div>
                <ResultsGrid
                  columns={executionResult.columns}
                  rows={executionResult.rows}
                  rowCount={executionResult.rowCount}
                  executionTimeMs={executionResult.executionTimeMs}
                />
              </div>
            )}

            {/* Analysis card */}
            {(analysisLoading || explainResult || optimizeResult || planResult || analysisError) && (
              <div className="card analysis-card">
                <AnalysisPanel
                  activeTab={analysisActiveTab}
                  onTabChange={setAnalysisActiveTab}
                  explainResult={explainResult}
                  optimizeResult={optimizeResult}
                  planResult={planResult}
                  onApplySuggestion={handleApplySuggestion}
                  loading={analysisLoading}
                />
                {analysisError && !analysisLoading && (
                  <div className="error-banner error-execution" style={{ marginTop: 10 }}>
                    {analysisError}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* sidebar */}
          <div className="workspace-sidebar">
            <div className="sidebar-card">
              <h3 className="sidebar-title">
                <Clock size={15} />
                Recent
              </h3>
              {recentQueries.length === 0 ? (
                <p className="sidebar-empty">No queries yet.</p>
              ) : (
                <div className="sidebar-list">
                  {recentQueries.map((item) => (
                    <div
                      key={item.timestamp}
                      className="sidebar-item"
                      onClick={() => handleRecentClick(item)}
                    >
                      <span className="sidebar-item-q">{item.question}</span>
                      <span className="sidebar-item-sql">{item.sql}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QueryWorkspace;
