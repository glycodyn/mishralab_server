import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './screens/dashboard';
import Glygen from './screens/glygen';
import Vis from './screens/vis';
import Header from './utils/header';
import JobViewer from './screens/render';
import './styles/nav.css'
import NGLViewer from './screens/DockingViewer.js';
import DockingResultPage from './screens/DockingResultPage';


function App() {
  
  return (
    <Router>
      <div className="App">
        < div className="header-container">
        <Header>
          <nav className={{ display: 'flex', color:'red', fontSize:'20px', gap: '1rem' }}>
            <Link to="/" className='nav-link'>Home</Link>
            <Link to="/glygen" className='nav-link'>Visualize Protein</Link>
            <Link to="/vis" className='nav-link'>AlphaFold3</Link>
            <Link to="/DockingViewer" className='nav-link'>Docking</Link>
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
            <Route path="/DockingViewer" element={<NGLViewer />} />
            <Route path="/run-docking" element={<DockingResultPage />} />

          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
