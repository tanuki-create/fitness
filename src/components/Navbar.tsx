import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  return (
    <nav className="navbar">
      <Link to="/" className="nav-logo">AI Fitness</Link>
      <ul className="nav-menu">
        <li className="nav-item">
          <Link to="/" className="nav-link">Dashboard</Link>
        </li>
        <li className="nav-item">
          <Link to="/chat" className="nav-link">AI Chat</Link>
        </li>
        <li className="nav-item">
          <Link to="/profile" className="nav-link">Profile</Link>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar; 