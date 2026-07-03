import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Database, LogOut } from 'lucide-react';
import './Navbar.css';

function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="navbar-brand">
          <NavLink to="/">
            <div className="navbar-logo-icon">
              <Database size={18} />
            </div>
            <span className="navbar-logo-text">QueryMind AI</span>
          </NavLink>
        </div>
        <div className="navbar-links">
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/connections">Databases</NavLink>
          <NavLink to="/schema">Schema Explorer</NavLink>
          <NavLink to="/workspace">Query Workspace</NavLink>
          <NavLink to="/history">History</NavLink>
          <NavLink to="/saved">Saved Queries</NavLink>
        </div>
        <div className="navbar-auth">
          {isAuthenticated ? (
            <>
              <span className="navbar-user">
                <span className="navbar-avatar">{initials}</span>
                {user?.name}
              </span>
              <button className="navbar-logout" onClick={handleLogout}>
                <LogOut size={15} />
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login">Login</NavLink>
              <NavLink to="/register">Register</NavLink>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
