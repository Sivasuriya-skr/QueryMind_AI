import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { useConnection } from '../../context/ConnectionContext';
import {
  Database,
  Plus,
  Server,
  Plug,
  Lock,
  User,
  Eye,
  EyeOff,
  Loader2,
  RefreshCw,
  Trash2,
  HardDrive,
} from 'lucide-react';
import './Connections.css';

const INITIAL_FORM = {
  connectionName: '',
  host: 'localhost',
  port: '3306',
  databaseName: '',
  username: 'root',
  password: '',
};

function Connections() {
  const [connections, setConnections] = useState([]);
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [testingId, setTestingId] = useState(null);
  const [testResults, setTestResults] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { selectConnection, activeConnection } = useConnection();

  const fetchConnections = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/connections');
      setConnections(res.data);
    } catch {
      setApiError('Failed to load connections');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const validate = () => {
    const errs = {};
    if (!form.connectionName.trim()) errs.connectionName = 'Required';
    else if (!/^[a-zA-Z0-9\s_-]+$/.test(form.connectionName))
      errs.connectionName = 'Letters, numbers, spaces, hyphens, underscores only';
    if (!form.host.trim()) errs.host = 'Required';
    if (!form.port || isNaN(form.port) || form.port < 1 || form.port > 65535)
      errs.port = 'Port must be 1–65535';
    if (!form.databaseName.trim()) errs.databaseName = 'Required';
    if (!form.username.trim()) errs.username = 'Required';
    if (!form.password) errs.password = 'Required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' });
  };

  const handleTestNew = async (e) => {
    e.preventDefault();
    setApiError('');
    if (!validate()) return;

    const testId = '__new__';
    setTestingId(testId);
    try {
      const res = await axiosInstance.post('/connections/test', {
        ...form,
        port: parseInt(form.port, 10),
      });
      setTestResults({ ...testResults, [testId]: res.data });
    } catch (err) {
      setTestResults({
        ...testResults,
        [testId]: { success: false, message: err.response?.data?.message || 'Test failed' },
      });
    } finally {
      setTestingId(null);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setApiError('');
    if (!validate()) return;

    setSaving(true);
    try {
      const res = await axiosInstance.post('/connections', {
        ...form,
        port: parseInt(form.port, 10),
      });
      setConnections([res.data, ...connections]);
      setForm(INITIAL_FORM);
      setErrors({});
      setTestResults({});
      setShowForm(false);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save connection';
      setApiError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleTestExisting = async (id) => {
    setTestingId(id);
    try {
      const res = await axiosInstance.post(`/connections/${id}/test`);
      setTestResults({ ...testResults, [id]: res.data });
    } catch (err) {
      setTestResults({
        ...testResults,
        [id]: { success: false, message: err.response?.data?.message || 'Test failed' },
      });
    } finally {
      setTestingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this connection?')) return;
    try {
      await axiosInstance.delete(`/connections/${id}`);
      setConnections(connections.filter((c) => c.id !== id));
      if (activeConnection?.id === id) {
        selectConnection(null);
      }
    } catch {
      setApiError('Failed to delete connection');
    }
  };

  const handleSelect = (conn) => {
    selectConnection(activeConnection?.id === conn.id ? null : conn);
  };

  const getConnectionStatus = (conn) => {
    const result = testResults[conn.id];
    if (!result) return 'untested';
    return result.success ? 'verified' : 'failed';
  };

  if (loading) return <div className="connections-loading">Loading connections...</div>;

  return (
    <div className="connections-page">
      <div className="conn-bg">
        <div className="conn-blob conn-blob-1" />
        <div className="conn-blob conn-blob-2" />
        <div className="conn-blob conn-blob-3" />
      </div>

      <div className="conn-content">
        {/* header */}
        <div className="conn-header">
          <div>
            <h1>Database Connections</h1>
            <p className="conn-subtitle">Manage the databases QueryMind AI can query</p>
          </div>
          <button className="conn-add-btn" onClick={() => setShowForm((prev) => !prev)}>
            <Plus size={18} />
            Add Connection
          </button>
        </div>

        {apiError && <div className="conn-error-banner">{apiError}</div>}

        {/* add connection form */}
        {showForm && (
          <div className="conn-form-card">
            <h3>New Connection</h3>
            <form onSubmit={handleSave} noValidate>
              <div className="conn-form-row">
                <div className="conn-field">
                  <label htmlFor="connectionName">Connection Name</label>
                  <div className="input-wrapper">
                    <HardDrive size={16} className="input-icon" />
                    <input
                      id="connectionName"
                      name="connectionName"
                      value={form.connectionName}
                      onChange={handleChange}
                      placeholder="e.g. Production DB"
                      className={errors.connectionName ? 'input-error' : ''}
                    />
                  </div>
                  {errors.connectionName && <span className="field-error">{errors.connectionName}</span>}
                </div>
              </div>

              <div className="conn-form-grid conn-form-grid-3">
                <div className="conn-field">
                  <label htmlFor="host">Host</label>
                  <div className="input-wrapper">
                    <Server size={16} className="input-icon" />
                    <input
                      id="host"
                      name="host"
                      value={form.host}
                      onChange={handleChange}
                      className={errors.host ? 'input-error' : ''}
                    />
                  </div>
                  {errors.host && <span className="field-error">{errors.host}</span>}
                </div>
                <div className="conn-field">
                  <label htmlFor="port">Port</label>
                  <input
                    id="port"
                    name="port"
                    value={form.port}
                    onChange={handleChange}
                    className={errors.port ? 'input-error' : ''}
                  />
                  {errors.port && <span className="field-error">{errors.port}</span>}
                </div>
                <div className="conn-field">
                  <label htmlFor="databaseName">Database</label>
                  <div className="input-wrapper">
                    <Database size={16} className="input-icon" />
                    <input
                      id="databaseName"
                      name="databaseName"
                      value={form.databaseName}
                      onChange={handleChange}
                      className={errors.databaseName ? 'input-error' : ''}
                    />
                  </div>
                  {errors.databaseName && <span className="field-error">{errors.databaseName}</span>}
                </div>
              </div>

              <div className="conn-form-grid conn-form-grid-2">
                <div className="conn-field">
                  <label htmlFor="username">Username</label>
                  <div className="input-wrapper">
                    <User size={16} className="input-icon" />
                    <input
                      id="username"
                      name="username"
                      value={form.username}
                      onChange={handleChange}
                      className={errors.username ? 'input-error' : ''}
                    />
                  </div>
                  {errors.username && <span className="field-error">{errors.username}</span>}
                </div>
                <div className="conn-field">
                  <label htmlFor="password">Password</label>
                  <div className="input-wrapper">
                    <Lock size={16} className="input-icon" />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={handleChange}
                      className={errors.password ? 'input-error' : ''}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword((prev) => !prev)}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && <span className="field-error">{errors.password}</span>}
                </div>
              </div>

              {testResults['__new__'] && (
                <div className={`test-badge ${testResults['__new__'].success ? 'test-ok' : 'test-fail'}`}>
                  {testResults['__new__'].message}
                </div>
              )}

              <div className="conn-form-actions">
                <button
                  type="button"
                  className="btn-outline"
                  onClick={handleTestNew}
                  disabled={testingId === '__new__'}
                >
                  {testingId === '__new__' ? (
                    <><Loader2 size={16} className="btn-spinner" /> Testing...</>
                  ) : (
                    <><Plug size={16} /> Test Connection</>
                  )}
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? (
                    <><Loader2 size={16} className="btn-spinner" /> Saving...</>
                  ) : (
                    'Save Connection'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* connection list */}
        <div className="conn-list">
          <h2>Saved Connections</h2>

          {connections.length === 0 && !loading && (
            <div className="conn-empty">
              <div className="conn-empty-icon">
                <Database size={40} />
              </div>
              <p className="conn-empty-title">No databases connected yet</p>
              <p className="conn-empty-text">
                Add a connection to start querying your database in plain English.
              </p>
              <button className="btn-primary" onClick={() => setShowForm(true)}>
                <Plus size={16} />
                Add Your First Connection
              </button>
            </div>
          )}

          {connections.map((conn) => {
            const status = getConnectionStatus(conn);
            return (
              <div
                key={conn.id}
                className={`conn-card ${activeConnection?.id === conn.id ? 'conn-active' : ''}`}
              >
                <div className="conn-card-left" onClick={() => handleSelect(conn)}>
                  <div className="conn-card-icon">
                    <Database size={20} />
                  </div>
                  <div className="conn-card-info">
                    <span className="conn-card-name">{conn.connectionName}</span>
                    <span className="conn-card-detail">
                      {conn.host}:{conn.port}/{conn.databaseName}
                    </span>
                  </div>
                </div>
                <div className="conn-card-right">
                  <span className={`conn-status status-${status}`}>
                    <span className="status-dot" />
                    {status === 'verified' ? 'Connected' : status === 'failed' ? 'Failed' : 'Untested'}
                  </span>
                  <button
                    className="conn-icon-btn conn-icon-test"
                    onClick={() => handleTestExisting(conn.id)}
                    disabled={testingId === conn.id}
                    title="Test connection"
                  >
                    {testingId === conn.id ? (
                      <Loader2 size={16} className="btn-spinner" />
                    ) : (
                      <RefreshCw size={16} />
                    )}
                  </button>
                  <button
                    className="conn-icon-btn conn-icon-delete"
                    onClick={() => handleDelete(conn.id)}
                    title="Delete connection"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Connections;
