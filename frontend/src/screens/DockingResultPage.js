import React, { useEffect, useState,useRef } from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/dockingResult.css";
import { Stage } from 'ngl';

const DockingResultPage = () => {
  const { state } = useLocation();
  const isGlycoTorch = state?.isGlycoTorch || false;
  const isVinaCarb = state?.isVinaCarb || false;
  const isPureVina = !isGlycoTorch && !isVinaCarb;
  const navigate = useNavigate();
  const viewerDiv = useRef(); // this points to the DOM element
  const stageRef = useRef();  // this stores the NGL stage instance
  const [ligandComponents, setLigandComponents] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);


  console.log("Flags:", { isGlycoTorch, isVinaCarb, isPureVina });
  console.log("Raw Score Table:\n", state?.scoreTable);

  useEffect(() => {
    const handlePopState = () => navigate("/", { replace: true });
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  //initialize the stage
  useEffect(() => {
    if (!stageRef.current && viewerDiv.current) {
      stageRef.current = new window.NGL.Stage(viewerDiv.current, { backgroundColor: 'white' });
    }
  }, []);
  

  const outputPath = state?.outputPath || "";
  const scoreTableRaw = state?.scoreTable || "No affinity results available.";
  const loading = state?.loading || false;

  const parseGlycoTorch = (line) => {
    const match = line.match(/^\s*(\d+)\s+(-?\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?\s*,\s*\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)/);
    if (match) {
      const [, mode, affinity1, chi, affinity2, rmsdLB, rmsdUB] = match;
      return { mode: mode.trim(), affinity1, chi, affinity2, rmsdLB, rmsdUB };
    }
    return null;
  };

  const parseVinaCarb = (line) => {
    const match = line.match(/^\s*(\d+)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)/);
    if (match) {
      const [, mode, affinity1, chi, affinity2, rmsdLB, rmsdUB] = match;
      return { mode: mode.trim(), affinity1, chi, affinity2, rmsdLB, rmsdUB };
    }
    return null;
  };

  const parseVina = (line) => {
    const match = line.match(/^\s*(\d+)\s+(-?\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)/);
    if (match) {
      const [, mode, affinity, rmsdLB, rmsdUB] = match;
      return {
        mode: mode.trim(),
        affinity1: affinity,
        chi: "—",
        affinity2: affinity,
        rmsdLB,
        rmsdUB
      };
    }
    return null;
  };

  const parseScoreTable = (text) => {
    const lines = text.split('\n');
    const data = [];
    let foundHeader = false;

    for (const line of lines) {
      console.log("🔍 LINE:", line);
      if (line.includes('mode') && line.includes('affinity')) {
        foundHeader = true;
        console.log("Found header line:", line);
        continue;
      }
      if (!foundHeader || line.trim() === '' || line.startsWith('---') || line.startsWith('WARNING') || line.startsWith('Writing') || line.startsWith('elapsed')) {
        console.log("Skipping line:", line);
        continue;
      }

      let parsed = null;
      if (isGlycoTorch) {
        console.log("Trying GlycoTorch parser for line:", line);
        parsed = parseGlycoTorch(line);
      } else if (isVinaCarb) {
        console.log("Trying VinaCarb parser for line:", line);
        parsed = parseVinaCarb(line);
      } else {
        console.log("Trying Vina parser for line:", line);
        parsed = parseVina(line);
      }

      if (parsed) {
        console.log("Parsed row:", parsed);
        data.push(parsed);
      } else {
        console.log("❌ No match Vina row:", line);
      }
    }
    return data;
  };
  
  const showLigand = (index) => {
    ligandComponents.forEach((comp, i) => comp.setVisibility(i === index));
    setCurrentIndex(index);
    //ligandComponents[index]?.autoView(true);
  };
  
  function cleanPDBQTText(text) {
    const lines = text.split('\n');
    const cleaned = lines.filter(line =>
      line.startsWith('MODEL') ||
      line.startsWith('ATOM') ||
      line.startsWith('HETATM') ||
      line.startsWith('ENDMDL')
    );
    return cleaned.join('\n');
  }
  useEffect(() => {
    if (state?.outputPath && state?.receptorPath && stageRef.current) {
      const fetchAndLoad = async () => {
        const outputUrl = `http://localhost:5000/vina/view?path=${encodeURIComponent(state.outputPath)}`;
        const receptorUrl = `http://localhost:5000/vina/view?path=${encodeURIComponent(state.receptorPath)}`;
        const stage = stageRef.current;
  
        if (!stage) return;
        stage.removeAllComponents();
  
        try {
          console.log('Fetching receptor:', receptorUrl);
          const receptorRes = await fetch(receptorUrl);
          const receptorBlob = new File([await receptorRes.blob()], 'receptor.pdbqt', { type: 'chemical/x-pdbqt' });
          const comp1 = await stage.loadFile(receptorBlob, { ext: 'pdbqt' });
          comp1.addRepresentation('cartoon', { color: 'chainname' });
  
          console.log('Fetching docked result (ligand):', outputUrl);
          const outputRes = await fetch(outputUrl);
          const outputText = await outputRes.text();
          const cleanedText = cleanPDBQTText(outputText); // ← your frontend cleaner
          console.log('Cleaned output text:', cleanedText);
  
          const models = cleanedText
            .split(/MODEL\s+\d+/)
            .slice(1)
            .map((chunk, i) => `MODEL ${i + 1}\n${chunk.trim().split("ENDMDL")[0]}\nENDMDL`);
  
            const ligandComps = [];

            for (let i = 0; i < models.length; i++) {
              const blob = new Blob([models[i]], { type: "text/plain" });
              const comp = await stage.loadFile(blob, { ext: 'pdb' });
              comp.addRepresentation('ball+stick', { color: 'element' });
              ligandComps.push(comp);
            }
            
            setLigandComponents(ligandComps);
            setLigandComponents(ligandComps);
            setCurrentIndex(0);
      
          stage.autoView();
        } catch (err) {
          console.error('❌ Error loading blobs into NGL:', err);
        }
      };
  
      fetchAndLoad();
    }
  }, [state?.outputPath, state?.receptorPath]);
  
  useEffect(() => {
    if (ligandComponents.length > 0) {
      ligandComponents.forEach((comp, i) => comp.setVisibility(i === 0));
      setCurrentIndex(0);
    }
  }, [ligandComponents]);
  
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
      handleUnload();
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, []);
  
  

  const parsedScores = parseScoreTable(scoreTableRaw);
  const hasTableData = parsedScores.length > 0;

  return (
    <div className="docking-result-page">
  {loading ? (
    <div className="loader-container">
      <div className="spinner"></div>
      <p>
      {
        isGlycoTorch
          ? "Running GlycoTorch"
          : isVinaCarb
          ? "Running Vina Carb"
          : isPureVina
          ? "Running AutoDock Vina"
          : "Idle"
      }
    </p>

    </div>
  ) : (
    <div className="result-output">
      <h2>Docking Output</h2>

      {hasTableData ? (
        <table className="affinity-table">
          <thead>
            <tr>
              <th>Model</th>
              <th>Affinity (kcal/mol)</th>
              <th>Chi, FFE</th>
              <th>Affinity (-chi -ff)</th>
              <th>RMSD LB</th>
              <th>RMSD UB</th>
            </tr>
          </thead>
          <tbody>
            {parsedScores.map((row, index) => (
              <tr key={index}>
                <td>{row.mode}</td>
                <td>{row.affinity1}</td>
                <td>{row.chi}</td>
                <td>{row.affinity2}</td>
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
    </div>
  )}

  <div className="viewer-container">
    <div className="ngl-viewer" ref={viewerDiv}></div>
    <div className="button-group vertical">
      <button
        className="primary-btn"
        onClick={() => showLigand((currentIndex - 1 + ligandComponents.length) % ligandComponents.length)}
        disabled={ligandComponents.length === 0}
      >
        ⏮ Prev
      </button>
      <span style={{ fontWeight: 'bold', textAlign: 'center' }}>Model {currentIndex + 1}</span>
      <button
        className="primary-btn"
        onClick={() => showLigand((currentIndex + 1) % ligandComponents.length)}
        disabled={ligandComponents.length === 0}
      >
        Next ⏭
      </button>
    </div>
  </div>

  <div className="button-group bottom-buttons">
    <button className="primary-btn" onClick={() => navigate("/")}>Back to Home</button>
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
  );
};

export default DockingResultPage;
