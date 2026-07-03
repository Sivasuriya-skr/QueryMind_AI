import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../api/axiosInstance';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Plug,
  Bookmark,
  BarChart3,
  Terminal,
  Database,
  FolderTree,
} from 'lucide-react';
import './Dashboard.css';

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

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ connections: 0, saved: 0, history: 0 });
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axiosInstance.get('/connections'),
      axiosInstance.get('/saved-queries'),
      axiosInstance.get('/history?page=0&size=5'),
    ])
      .then(([connRes, savedRes, histRes]) => {
        setStats({
          connections: connRes.data.length,
          saved: savedRes.data.length,
          history: histRes.data.totalElements || 0,
        });
        setRecent(histRes.data.content || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleReRun = (item) => {
    sessionStorage.setItem('reRunSql', item.executedSql || item.generatedSql || '');
    sessionStorage.setItem('reRunQuestion', item.naturalLanguageQuestion || '');
    navigate('/workspace');
  };

  const statusIcon = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'success':
        return <CheckCircle size={15} />;
      case 'failed':
        return <XCircle size={15} />;
      default:
        return <AlertCircle size={15} />;
    }
  };

  return (
    <div className="dashboard-page">
      {/* blurred background blobs */}
      <div className="dash-bg">
        <div className="dash-blob dash-blob-1" />
        <div className="dash-blob dash-blob-2" />
        <div className="dash-blob dash-blob-3" />
      </div>

      <div className="dash-content">
        <div className="dashboard-header">
          <h1>Welcome{user?.name ? `, ${user.name}` : ''}</h1>
          <p className="dashboard-subtitle">QueryMind AI Dashboard</p>
        </div>

        <div className="dashboard-stats">
          <div className="stat-card" onClick={() => navigate('/connections')}>
            <div className="stat-icon-badge stat-icon-cyan">
              <Plug size={18} />
            </div>
            <span className="stat-number">{loading ? '...' : stats.connections}</span>
            <span className="stat-label">Connections</span>
          </div>
          <div className="stat-card" onClick={() => navigate('/saved')}>
            <div className="stat-icon-badge stat-icon-amber">
              <Bookmark size={18} />
            </div>
            <span className="stat-number">{loading ? '...' : stats.saved}</span>
            <span className="stat-label">Saved Queries</span>
          </div>
          <div className="stat-card" onClick={() => navigate('/history')}>
            <div className="stat-icon-badge stat-icon-green">
              <BarChart3 size={18} />
            </div>
            <span className="stat-number">{loading ? '...' : stats.history}</span>
            <span className="stat-label">Total Queries</span>
          </div>
          <div className="stat-card stat-card-cta" onClick={() => navigate('/workspace')}>
            <div className="stat-icon-badge stat-icon-white">
              <Plus size={22} />
            </div>
            <span className="stat-number stat-number-white">New</span>
            <span className="stat-label stat-label-white">Query</span>
          </div>
        </div>

        <div className="dashboard-section">
          <h2>Recent Queries</h2>
          {loading ? (
            <p className="dashboard-muted">Loading...</p>
          ) : recent.length === 0 ? (
            <p className="dashboard-muted">No queries yet. <a href="/workspace">Run your first query</a>.</p>
          ) : (
            <div className="dashboard-recent-list">
              {recent.map((item) => (
                <div
                  key={item.id}
                  className={`dashboard-recent-item status-${(item.status || '').toLowerCase()}`}
                  onClick={() => handleReRun(item)}
                >
                  <div className="recent-main">
                    {item.naturalLanguageQuestion && (
                      <span className="recent-question">{item.naturalLanguageQuestion}</span>
                    )}
                    <code
                      className="recent-sql"
                      dangerouslySetInnerHTML={{ __html: highlightSql(item.executedSql || item.generatedSql) }}
                    />
                  </div>
                  <div className="recent-meta">
                    {item.executionTimeMs != null && (
                      <span className={`recent-time-pill ${(item.status || '').toLowerCase()}`}>
                        {item.executionTimeMs}ms
                      </span>
                    )}
                    <span className="recent-status-icon">{statusIcon(item.status)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dashboard-section">
          <h2>Quick Actions</h2>
          <div className="dashboard-actions">
            <button className="dash-action-btn" onClick={() => navigate('/workspace')}>
              <Terminal size={20} />
              <span>Open Workspace</span>
            </button>
            <button className="dash-action-btn" onClick={() => navigate('/connections')}>
              <Database size={20} />
              <span>Manage Databases</span>
            </button>
            <button className="dash-action-btn" onClick={() => navigate('/schema')}>
              <FolderTree size={20} />
              <span>Browse Schema</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
