import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './screens/dashboard';
import Glygen from './screens/glygen';
import Vis from './screens/vis';
import Header from './utils/header';
import './styles/nav.css'

function App() {
  
  return (
    <Router>
      <div className="App">
        <Header>
          <nav className={{ display: 'flex', color:'red', fontSize:'20px', gap: '1rem' }}>
            <Link to="/" className='nav-link'>Dashboard</Link>
            <Link to="/glygen" className='nav-link'>Glygen</Link>
            <Link to="/vis" className='nav-link'>Vis</Link>
          </nav>
        </Header>
        <main className="App-main">
          <Routes>
          
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />ß
            <Route path="/glygen" element={<Glygen />} />
            <Route path ="/vis" element={<Vis />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
