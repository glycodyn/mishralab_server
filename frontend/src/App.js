import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './screens/dashboard';
import Glygen from './screens/glygen';
import Vis from './screens/vis';
import Header from './utils/header';
import './styles/nav.css'
import DockingViewer from './screens/DockingViewer';



function App() {
  
  return (
    <Router>
      <div className="App">
        <Header>
          <nav className={{ display: 'flex', color:'red', fontSize:'20px', gap: '1rem' }}>
            <Link to="/" className='nav-link'>Dashboard</Link>
<<<<<<< Updated upstream
            <Link to="/glygen" className='nav-link'>Glygen</Link>
            <Link to="/vis" className='nav-link'>Vis</Link>
=======
            <Link to="/glygen" className='nav-link'>Visualize Protein</Link>
            <Link to="/vis" className='nav-link'>AlphaFold3</Link>
            <Link to="/docking" className='nav-link'>Run Molecular Docking</Link>


>>>>>>> Stashed changes
          </nav>
        </Header>
        <main className="App-main">
          <Routes>
          
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />ß
            <Route path="/glygen" element={<Glygen />} />
            <Route path ="/vis" element={<Vis />} />
<<<<<<< Updated upstream
=======
            <Route path="/viewer" element={<JobViewer />} />
            <Route path="/docking" element={<DockingViewer />} />

>>>>>>> Stashed changes
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
