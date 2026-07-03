import { Link } from 'react-router-dom';
import './ForgotPassword.css';

function ForgotPassword() {
  return (
    <div className="forgot-page">
      <div className="forgot-card">
        <h1>Forgot Password</h1>
        <p>Password reset is coming soon. Check back later.</p>
        <Link to="/login" className="forgot-back">Back to Sign In</Link>
      </div>
    </div>
  );
}

export default ForgotPassword;
