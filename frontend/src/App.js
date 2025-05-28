import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './screens/dashboard';
import Glygen from './screens/glygen';

function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <nav style={{ display: 'flex', gap: '1rem', padding: '1rem', background: '#f5f5f5' }}>
            <Link to="/" style={{ textDecoration: 'none' }}>Dashboard</Link>
            <Link to="/glygen" style={{ textDecoration: 'none' }}>Glygen</Link>
          </nav>
        </header>
        <main className="App-main">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/glygen" element={<Glygen />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
