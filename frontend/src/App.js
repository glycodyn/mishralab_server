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
import LoginSignup from './utils/authentication';
import Boltz from './screens/Boltz2';
import BoltzViewer from './screens/Boltz_viewer';
import Tutorials from './screens/tutorials';
import DockingResultPage from './screens/DockingResultPage';

function App() {
  
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <div className="header-container">
            <Header>
              <nav className={{ display: 'flex', color:'red', fontSize:'20px', gap: '1rem' }}>
                <Link to="/" className='nav-link'>Home</Link>
                <Link to="/tutorials" className='nav-link'>Tutorials</Link>
                
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
                  // <RequireAuth>
                  //   <Vis />
                  // </RequireAuth>
                  <Vis />
                }
              />
              <Route
                path="/viewer"
                element={
                  // <RequireAuth>
                  //   <JobViewer />
                  // </RequireAuth>
                  <JobViewer />
                }
              />
              <Route
                path="/docking"
                element={
                  // <RequireAuth>
                  //   <DockingViewer />
                  // </RequireAuth>
                  <DockingViewer />
                }
              />
              <Route
                path="/DockingViewer"
                element={
                  // <RequireAuth>
                  //   <DockingViewer />
                  // </RequireAuth>
                  <DockingViewer />
                }
              />
              <Route
                path="/ligandMPNN"
                element={
                  // <RequireAuth>
                  //   <LigandMPNNScreen />
                  // </RequireAuth>
                  <LigandMPNNScreen />
                }
              />
              <Route
                path='/boltz'
                element={
                  // <RequireAuth>
                  //   <Boltz />
                  // </RequireAuth>
                  <Boltz />
                }
              />
              <Route
                path='/boltz-viewer'
                element={
                  // <RequireAuth>
                  //   <BoltzViewer />
                  // </RequireAuth>
                  <BoltzViewer />
                }
              />
              <Route
              path='/tutorials'
              element={
                <Tutorials />
              }
              />
              <Route
                path="/run-docking"
                element={<DockingResultPage />}
              />
              {/* <Route path='/login' element={<LoginSignup />} /> */}
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}


export default App;
