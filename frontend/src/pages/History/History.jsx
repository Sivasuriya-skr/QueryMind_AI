import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Bookmark, Trash2, Clock, Database, ChevronLeft, ChevronRight } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';
import { useConnection } from '../../context/ConnectionContext';
import SkeletonTable from '../../components/Skeleton/SkeletonTable';
import './History.css';

const PAGE_SIZE = 20;

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

function SaveForm({ item, onClose }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setError('');
    try {
      await axiosInstance.post('/saved-queries', {
        connectionId: item.connectionId,
        title: title.trim(),
        sql: item.executedSql || item.generatedSql,
        description: description.trim(),
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save query');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="history-modal-overlay" onClick={onClose}>
      <div className="history-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Save Query</h3>
        <form onSubmit={handleSave}>
          <label>
            Title
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your query a name"
              autoFocus
              required
            />
          </label>
          <label>
            Description
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={3}
            />
          </label>
          {error && <div className="history-form-error">{error}</div>}
          <div className="history-modal-actions">
            <button type="button" className="history-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="history-btn-primary" disabled={saving || !title.trim()}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function History() {
  const navigate = useNavigate();
  const { activeConnection } = useConnection();
  const [entries, setEntries] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [saveTarget, setSaveTarget] = useState(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, size: PAGE_SIZE };
      if (statusFilter) params.status = statusFilter;
      if (activeConnection) params.connectionId = activeConnection.id;

      const res = await axiosInstance.get('/history', { params });
      setEntries(res.data.content || []);
      setTotalPages(res.data.totalPages || 0);
      setTotalElements(res.data.totalElements || 0);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load history');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, activeConnection]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleReRun = (item) => {
    sessionStorage.setItem('reRunSql', item.executedSql || item.generatedSql || '');
    sessionStorage.setItem('reRunQuestion', item.naturalLanguageQuestion || '');
    navigate('/workspace');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this history entry?')) return;
    try {
      await axiosInstance.delete(`/history/${id}`);
      fetchHistory();
    } catch (err) {
      setError('Failed to delete entry');
    }
  };

  const formatDate = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatTimeAgo = (ts) => {
    if (!ts) return '';
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const statusBorderClass = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'success') return 'history-card-border-success';
    if (s === 'failed') return 'history-card-border-failed';
    if (s === 'blocked') return 'history-card-border-blocked';
    return '';
  };

  const statusPill = (status) => {
    const s = (status || '').toLowerCase();
    const cls = s === 'success' ? 'status-pill-success' : s === 'failed' ? 'status-pill-failed' : 'status-pill-blocked';
    return <span className={`status-pill ${cls}`}>{status || 'UNKNOWN'}</span>;
  };

  const timePillClass = (ms) => {
    if (ms == null) return '';
    if (ms < 500) return 'time-pill-fast';
    if (ms < 2000) return 'time-pill-medium';
    return 'time-pill-slow';
  };

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(0, page - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible);
    if (end - start < maxVisible) start = Math.max(0, end - maxVisible);

    for (let i = start; i < end; i++) {
      pages.push(
        <button
          key={i}
          className={`page-pill ${i === page ? 'page-pill-active' : ''}`}
          onClick={() => setPage(i)}
        >
          {i + 1}
        </button>
      );
    }
    return pages;
  };

  return (
    <div className="history-page">
      <div className="history-bg">
        <div className="history-blob history-blob-1" />
        <div className="history-blob history-blob-2" />
      </div>

      <div className="history-content">
        <div className="history-header">
          <div>
            <h1>Query History</h1>
            <p className="history-subtitle">Past natural language queries and their results</p>
          </div>
          <div className="history-controls">
            <select
              className="history-filter"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
            >
              <option value="">All statuses</option>
              <option value="SUCCESS">Success</option>
              <option value="FAILED">Failed</option>
              <option value="BLOCKED">Blocked</option>
            </select>
            <span className="history-count">{totalElements} entries</span>
          </div>
        </div>

        {error && <div className="history-error">{error}</div>}

        {loading && (
          <div className="history-loading">
            <SkeletonTable rows={5} cols={6} />
          </div>
        )}

        {!loading && entries.length === 0 && (
          <div className="history-empty-card">
            {statusFilter ? (
              <>
                <div className="history-empty-icon">
                  <Database size={32} />
                </div>
                <p className="history-empty-title">No matching entries</p>
                <p className="history-empty-text">Try a different filter.</p>
              </>
            ) : (
              <>
                <div className="history-empty-icon">
                  <Clock size={32} />
                </div>
                <p className="history-empty-title">No queries yet</p>
                <p className="history-empty-text">Ask something in the Workspace to see your history here.</p>
                <button className="btn-primary" onClick={() => navigate('/workspace')}>
                  Go to Workspace
                </button>
              </>
            )}
          </div>
        )}

        {!loading && entries.length > 0 && (
          <>
            <div className="history-list">
              {entries.map((item) => (
                <div key={item.id} className={`history-card ${statusBorderClass(item.status)}`}>
                  <div className="history-card-body">
                    <div className="history-card-top">
                      <h3 className="history-card-question">
                        {item.naturalLanguageQuestion || 'SQL Query'}
                      </h3>
                      <div className="history-card-actions">
                        <button
                          className="history-icon-btn"
                          onClick={() => handleReRun(item)}
                          title="Re-run in Workspace"
                        >
                          <RefreshCw size={15} />
                        </button>
                        <button
                          className="history-icon-btn"
                          onClick={() => setSaveTarget(item)}
                          title="Save this query"
                        >
                          <Bookmark size={15} />
                        </button>
                        <button
                          className="history-icon-btn history-icon-btn-danger"
                          onClick={() => handleDelete(item.id)}
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                    {item.executedSql || item.generatedSql ? (
                      <code
                        className="history-card-sql"
                        dangerouslySetInnerHTML={{ __html: highlightSql(item.executedSql || item.generatedSql) }}
                      />
                    ) : null}
                    <div className="history-card-footer">
                      <div className="history-card-meta">
                        {statusPill(item.status)}
                        <span className="history-card-timeago">{formatTimeAgo(item.createdAt)}</span>
                        <span className="history-card-date">{formatDate(item.createdAt)}</span>
                      </div>
                      <div className="history-card-stats">
                        {item.executionTimeMs != null && (
                          <span className={`time-pill ${timePillClass(item.executionTimeMs)}`}>
                            <Clock size={11} />
                            {item.executionTimeMs}ms
                          </span>
                        )}
                        {item.rowCount != null && (
                          <span className="time-pill time-pill-neutral">
                            <Database size={11} />
                            {item.rowCount.toLocaleString()} rows
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="history-pagination">
                <button
                  className="page-nav-btn"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  <ChevronLeft size={15} />
                  Previous
                </button>
                <div className="page-pills">
                  {renderPageNumbers()}
                </div>
                <button
                  className="page-nav-btn"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                  <ChevronRight size={15} />
                </button>
              </div>
            )}
          </>
        )}

        {saveTarget && (
          <SaveForm item={saveTarget} onClose={() => setSaveTarget(null)} />
        )}
      </div>
    </div>
  );
}

export default History;
