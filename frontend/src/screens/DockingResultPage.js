import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate} from "react-router-dom";
import "../styles/dockingResult.css";



const DockingResultPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handlePopState = (event) => {
      navigate("/", { replace: true });
    };
  
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);
  

  const outputPath = state?.outputPath || "";

  const scoreTableRaw = state?.scoreTable || "No affinity results available.";
  const loading = state?.loading || false;

  // Parse affinity values from scoreTable string
  const parseScoreTable = (text) => {
    const lines = text.split('\n');
    const data = [];
  
    for (const line of lines) {
      if (/^\s*\d+\s+[-\d.]+\s+[-\d.]+\s+[-\d.]+/.test(line)) {
        const [mode, affinity, rmsdLB, rmsdUB] = line.trim().split(/\s+/);
        data.push({ mode, affinity, rmsdLB, rmsdUB });
      }
    }
  
    return data;
  };


  useEffect(() => {
    const handleUnload = async () => {
      await fetch('http://localhost:5000/vina/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receptorPath: state?.receptorPath,
          ligandPath: state?.ligandPath,
          configPath: state?.configPath,
          outputPath: state?.outputPath,
        }),
      });
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => {
      handleUnload(); // call it when navigating away
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, []);

  

  const parsedScores = parseScoreTable(scoreTableRaw);

  return (
  <div className="docking-result-page">
    {loading ? (
      <div className="loader-container">
        <div className="spinner"></div>
        <p>Running AutoDock Vina...</p>
      </div>
    ) : (
      <div className="result-output">
        <h2>Docking Output</h2>

        {parsedScores.length > 0 ? (
          <table className="affinity-table">
            <thead>
              <tr>
                <th>Model</th>
                <th>Affinity (kcal/mol)</th>
                <th>Distance from RMSD LB</th>
                <th>Best mode RMSD UB</th>
              </tr>
            </thead>
            <tbody>
              {parsedScores.map((row, index) => (
                <tr key={index}>
                  <td>{row.mode}</td>
                  <td>{row.affinity}</td>
                  <td>{row.rmsdLB}</td>
                  <td>{row.rmsdUB}</td>
                </tr>
              ))}
            </tbody>

          </table>
        ) : (
          <div className="score-fallback">
            <pre className="score-table">{scoreTableRaw}</pre>
          </div>
        )}

        <div className="button-group">
          <button className="primary-btn" onClick={() => navigate("/")}>
            Back to Home
          </button>
          {outputPath && (
            <a
            href={`http://localhost:5000/vina/download?path=${encodeURIComponent(outputPath)}`}
            download
            
            >
              <button className="primary-btn">Download Output</button>
            </a>
          )}
        </div>
      </div>
    )}
  </div>
);

};

export default DockingResultPage;
