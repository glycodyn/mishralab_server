import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './screens/dashboard';
import Glygen from './screens/glygen';
import Vis from './screens/vis';
import Header from './utils/header';
import JobViewer from './screens/render';
import './styles/nav.css'

function App() {
  
  return (
    <Router>
      <div className="App">
        < div classname="header-container">
        <Header>
          <nav className={{ display: 'flex', color:'red', fontSize:'20px', gap: '1rem' }}>
            <Link to="/" className='nav-link'>Home</Link>
            <Link to="/glygen" className='nav-link'>Visualize Protein</Link>
            <Link to="/vis" className='nav-link'>AlphaFold3</Link>
          </nav>
        </Header>
        </div>
        <main className="App-main">
          <Routes>
          
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />ß
            <Route path="/glygen" element={<Glygen />} />
            <Route path ="/vis" element={<Vis />} />
            <Route path="/viewer" element={<JobViewer />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
