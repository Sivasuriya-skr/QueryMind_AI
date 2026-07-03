import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Pencil, Trash2, ArrowRight } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';
import SkeletonCard from '../../components/Skeleton/SkeletonCard';
import './SavedQueries.css';

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

function EditForm({ item, onClose, onSaved }) {
  const [title, setTitle] = useState(item?.title || '');
  const [description, setDescription] = useState(item?.description || '');
  const [sql, setSql] = useState(item?.sql || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const isNew = !item;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setError('');
    try {
      if (isNew) {
        await axiosInstance.post('/saved-queries', { connectionId: item.connectionId, title: title.trim(), sql: sql.trim(), description: description.trim() });
      } else {
        await axiosInstance.put(`/saved-queries/${item.id}`, { connectionId: item.connectionId, title: title.trim(), sql: sql.trim(), description: description.trim() });
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="sq-modal-overlay" onClick={onClose}>
      <div className="sq-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sq-modal-icon">
          <Bookmark size={22} />
        </div>
        <h3>{isNew ? 'Save Query' : 'Edit Query'}</h3>
        <form onSubmit={handleSubmit}>
          <label>
            Title
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Query name" autoFocus required />
          </label>
          {isNew && (
            <label>
              Connection ID
              <input type="number" value={item.connectionId} disabled />
            </label>
          )}
          <label>
            SQL
            <textarea value={sql} onChange={(e) => setSql(e.target.value)} rows={4} required />
          </label>
          <label>
            Description
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" rows={2} />
          </label>
          {error && <div className="sq-form-error">{error}</div>}
          <div className="sq-modal-actions">
            <button type="button" className="sq-btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="sq-btn-primary" disabled={saving || !title.trim() || !sql.trim()}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SavedQueries() {
  const navigate = useNavigate();
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(null);

  const fetchQueries = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axiosInstance.get('/saved-queries');
      setQueries(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load saved queries');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueries();
  }, [fetchQueries]);

  const handleLoad = (item) => {
    sessionStorage.setItem('reRunSql', item.sql || '');
    sessionStorage.setItem('reRunQuestion', `Saved: ${item.title}`);
    navigate('/workspace');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this saved query?')) return;
    try {
      await axiosInstance.delete(`/saved-queries/${id}`);
      fetchQueries();
    } catch (err) {
      setError('Failed to delete');
    }
  };

  const formatDate = (ts) => {
    if (!ts) return '';
    return new Date(ts).toLocaleDateString();
  };

  return (
    <div className="sq-page">
      <div className="sq-bg">
        <div className="sq-blob sq-blob-1" />
        <div className="sq-blob sq-blob-2" />
      </div>

      <div className="sq-content">
        <div className="sq-header">
          <div>
            <h1>Saved Queries</h1>
            <p className="sq-subtitle">Bookmarked queries for quick reuse</p>
          </div>
          <span className="sq-count">{queries.length} saved</span>
        </div>

        {error && <div className="sq-error">{error}</div>}

        {loading && (
          <div className="sq-loading">
            <SkeletonCard count={3} />
          </div>
        )}

        {!loading && queries.length === 0 && (
          <div className="sq-empty-card">
            <div className="sq-empty-icon">
              <Bookmark size={32} />
            </div>
            <p className="sq-empty-title">No saved queries yet</p>
            <p className="sq-empty-text">Save queries from the History page or Workspace to access them here.</p>
            <button className="btn-primary" onClick={() => navigate('/workspace')}>
              Go to Workspace
            </button>
          </div>
        )}

        {!loading && queries.length > 0 && (
          <div className="sq-list">
            {queries.map((item) => (
              <div key={item.id} className="sq-card">
                <div className="sq-card-badge">
                  <Bookmark size={13} />
                </div>
                <div className="sq-card-header">
                  <h3 className="sq-card-title">{item.title}</h3>
                  <div className="sq-card-header-actions">
                    <button
                      className="sq-icon-btn"
                      onClick={() => setEditing(item)}
                      title="Edit"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      className="sq-icon-btn sq-icon-btn-danger"
                      onClick={() => handleDelete(item.id)}
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                {item.description && <p className="sq-card-desc">{item.description}</p>}
                <code
                  className="sq-card-sql"
                  dangerouslySetInnerHTML={{ __html: highlightSql(item.sql) }}
                />
                <div className="sq-card-footer">
                  <span className="sq-card-date">Saved on {formatDate(item.createdAt)}</span>
                  <button className="sq-btn-load" onClick={() => handleLoad(item)}>
                    <ArrowRight size={14} />
                    Load into workspace
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {editing && (
          <EditForm item={editing} onClose={() => setEditing(null)} onSaved={fetchQueries} />
        )}
        {creating && (
          <EditForm item={creating} onClose={() => setCreating(null)} onSaved={fetchQueries} />
        )}
      </div>
    </div>
  );
}

export default SavedQueries;
