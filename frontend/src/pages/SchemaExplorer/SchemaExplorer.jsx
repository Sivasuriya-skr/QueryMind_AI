import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConnection } from '../../context/ConnectionContext';
import axiosInstance from '../../api/axiosInstance';
import {
  Database,
  Table2,
  ChevronDown,
  Key,
  Link,
  RefreshCw,
  Plus,
  Loader2,
} from 'lucide-react';
import './SchemaExplorer.css';

function SchemaExplorer() {
  const { activeConnection } = useConnection();
  const navigate = useNavigate();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [expandedTable, setExpandedTable] = useState(null);

  useEffect(() => {
    if (!activeConnection) return;
    setLoading(true);
    setError('');
    setTables([]);

    axiosInstance.get(`/connections/${activeConnection.id}/schema`)
      .then((res) => setTables(res.data || []))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load schema'))
      .finally(() => setLoading(false));
  }, [activeConnection]);

  const handleRefresh = () => {
    if (!activeConnection) return;
    setRefreshing(true);
    setError('');
    axiosInstance.get(`/connections/${activeConnection.id}/schema`)
      .then((res) => setTables(res.data || []))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load schema'))
      .finally(() => setRefreshing(false));
  };

  const toggleTable = (name) => {
    setExpandedTable(expandedTable === name ? null : name);
  };

  if (!activeConnection) {
    return (
      <div className="schema-page">
        <div className="schema-bg">
          <div className="schema-blob schema-blob-1" />
          <div className="schema-blob schema-blob-2" />
          <div className="schema-blob schema-blob-3" />
        </div>
        <div className="schema-content">
          <div className="schema-empty">
            <div className="schema-empty-icon">
              <Database size={40} />
            </div>
            <p className="schema-empty-title">No database selected</p>
            <p className="schema-empty-text">
              Select or add a connection to explore its schema.
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
    <div className="schema-page">
      <div className="schema-bg">
        <div className="schema-blob schema-blob-1" />
        <div className="schema-blob schema-blob-2" />
        <div className="schema-blob schema-blob-3" />
      </div>

      <div className="schema-content">
        {/* header */}
        <div className="schema-header">
          <div>
            <h1>Schema Explorer</h1>
            <p className="schema-subtitle">
              {activeConnection.connectionName}
              <span className="schema-subtitle-detail">
                {activeConnection.host}:{activeConnection.port}/{activeConnection.databaseName}
              </span>
            </p>
          </div>
          <button
            className="btn-outline"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh Schema'}
          </button>
        </div>

        {/* loading skeleton */}
        {loading && (
          <div className="schema-skeleton-list">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="schema-skeleton-card">
                <div className="skeleton-row">
                  <div className="skeleton-icon" />
                  <div className="skeleton-line skeleton-line-wide" />
                  <div className="skeleton-line skeleton-line-narrow" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* error */}
        {error && <div className="schema-error">{error}</div>}

        {/* empty */}
        {!loading && tables.length === 0 && !error && (
          <div className="schema-empty">
            <div className="schema-empty-icon">
              <Table2 size={40} />
            </div>
            <p className="schema-empty-title">No tables found</p>
            <p className="schema-empty-text">
              This database appears to have no tables, or the connected user lacks permissions.
            </p>
          </div>
        )}

        {/* table list */}
        {!loading && tables.length > 0 && (
          <div className="schema-table-list">
            {tables.map((table) => {
              const expanded = expandedTable === table.name;
              return (
                <div key={table.name} className={`table-card ${expanded ? 'table-expanded' : ''}`}>
                  <div className="table-card-header" onClick={() => toggleTable(table.name)}>
                    <div className="table-header-left">
                      <div className="table-icon-badge">
                        <Table2 size={18} />
                      </div>
                      <span className="table-name">{table.name}</span>
                      <span className="table-count">{table.columns?.length || 0} cols</span>
                    </div>
                    <ChevronDown size={18} className={`table-chevron ${expanded ? 'chevron-open' : ''}`} />
                  </div>

                  {expanded && table.columns && (
                    <div className="table-columns">
                      <div className="cols-header">
                        <span className="cols-h-name">Column</span>
                        <span className="cols-h-type">Type</span>
                        <span className="cols-h-keys">Keys</span>
                      </div>
                      {table.columns.map((col) => (
                        <div key={col.name} className="col-row">
                          <span className="col-name">{col.name}</span>
                          <span className="col-type">{col.type}</span>
                          <span className="col-keys">
                            {col.primaryKey && (
                              <span className="col-key col-pk">
                                <Key size={11} /> PK
                              </span>
                            )}
                            {col.foreignKey && (
                              <span className="col-key col-fk">
                                <Link size={11} /> FK &rarr; {col.foreignKey}
                              </span>
                            )}
                            {!col.primaryKey && !col.foreignKey && (
                              <span className="col-null">{col.nullable !== false ? 'NULL' : 'NOT NULL'}</span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default SchemaExplorer;
