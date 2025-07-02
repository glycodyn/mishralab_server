import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './screens/dashboard';
import Glygen from './screens/glygen';
import Vis from './screens/vis';
import Header from './utils/header';
import JobViewer from './screens/render';
import './styles/nav.css'
import DockingViewer from './screens/dockingViewer';
import LigandMPNNScreen from './screens/ligandMPNN';
import { AuthProvider } from './context/authCOntext';
import RequireAuth from './components/requireAuth';

function App() {
  
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <div className="header-container">
            <Header>
              <nav className={{ display: 'flex', color:'red', fontSize:'20px', gap: '1rem' }}>
                <Link to="/" className='nav-link'>Home</Link>
                <Link to="/vis" className='nav-link'>AlphaFold3</Link>
                <Link to="/ligandMPNN" className='nav-link'>Ligand MPNN</Link>
                <Link to="/docking" className='nav-link'>Docking Viewer</Link>
                
              </nav>
            </Header>
          </div>
          <main className="App-main">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route
                path="/vis"
                element={
                  <RequireAuth>
                    <Vis />
                  </RequireAuth>
                }
              />
              <Route
                path="/viewer"
                element={
                  <RequireAuth>
                    <JobViewer />
                  </RequireAuth>
                }
              />
              <Route
                path="/docking"
                element={
                  <RequireAuth>
                    <DockingViewer />
                  </RequireAuth>
                }
              />
              <Route
                path="/ligandMPNN"
                element={
                  <RequireAuth>
                    <LigandMPNNScreen />
                  </RequireAuth>
                }
              />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}


export default App;
