import React from "react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import '../styles/dashboard.css';

function Glygen(){
    const[uniport, setUniport] = useState('');
    const [info, setInfo] = useState('');
    const [sequence, setSequence] = useState('');
    const [pdbId, setPdbId] = useState([]);
    const [selectedPdbId, setSelectedPdbId] = useState('');
    const [colorScheme, setColorScheme] = useState('spectrum');
    const [style, setStyle] = useState('cartoon');
    const [showAxes, setShowAxes] = useState(false);
    const [showLabels, setShowLabels] = useState(false);
    const [showSurface, setShowSurface] = useState(false);
    const protein_search = async() => {
        try{
            const res = await fetch(`https://rest.uniprot.org/uniprotkb/${uniport}.fasta`);
            
            const res2 = await fetch(`https://rest.uniprot.org/uniprotkb/${uniport}.json`)
            
            if(res.ok){
                const fasta = await res.text();
                setInfo(fasta.split('\n')[0]); 
                setSequence(fasta.split('\n').slice(1).join(''));
                console.log(fasta);
                
                
            } else {
                console.error('Error fetching data:', res.status);
            }

            if(res2.ok){
                const data = await res2.json();
                setPdbId(data.uniProtKBCrossReferences.filter(ref => ref.database === 'PDB').map(ref => ref.id));
                if (pdbId.length > 0) {
                    // Load the first PDB ID into 3Dmol
                    const pdb = pdbId[0];
                    const pdbRes = await fetch(`https://files.rcsb.org/download/${pdb}.pdb`);
                    const pdbText = await pdbRes.text();
            
                    const viewer = window.$3Dmol.createViewer("viewer", {
                        defaultcolors: window.$3Dmol.rasmolElementColors,
                        backgroundColor: 'white'
                    });
            
                    viewer.addModel(pdbText, "pdb");
                    viewer.setStyle({}, { cartoon: { color: 'spectrum' } });
                    viewer.zoomTo();
                    viewer.render();
                }
            
            }else{
                console.error('Error fetching pdb data:', res2.status);
            }
        }catch(error){
            console.error('Error:', error);
        }
    }

    

    const copyToClipboard = () => {
        navigator.clipboard.writeText(sequence)
            .then(() => alert("Copied to clipboard!"))
            .catch(() => alert("Failed to copy."));
    };

    const loadPDBStructure = async (pdb, styleType = style, color = colorScheme) => {
        try {
          const pdbRes = await fetch(`https://files.rcsb.org/download/${pdb}.pdb`);
          const pdbText = await pdbRes.text();
      
          const viewerElement = document.getElementById("viewer");
          viewerElement.innerHTML = "";
      
          const viewer = window.$3Dmol.createViewer(viewerElement, {
            defaultcolors: window.$3Dmol.rasmolElementColors,
            backgroundColor: 'white',
          });
      
          viewer.addModel(pdbText, "pdb");
      
          const styleObj = {};
          styleObj[styleType] = { color };
      
          viewer.setStyle({}, styleObj);
      
          if (showLabels) {
            viewer.addLabel("Residues", { position: { x: 0, y: 0, z: 0 }, backgroundColor: "white" });
          }
      
          if (showSurface) {
            viewer.addSurface(window.$3Dmol.SurfaceType.SAS, { opacity: 0.5, color: "lightblue" });
          }
      
          if (showAxes) {
            viewer.drawAxes();
          }
      
          viewer.zoomTo();
          viewer.render();
          window.currentViewer = viewer; // for resetCamera button to access later
        } catch (err) {
          console.error("Error loading structure:", err);
        }
      };

      const handleAxesToggle = () => {
        setShowAxes(prev => !prev);
        if (selectedPdbId) loadPDBStructure(selectedPdbId, style, colorScheme);
      };
      
      const handleLabelsToggle = () => {
        setShowLabels(prev => !prev);
        if (selectedPdbId) loadPDBStructure(selectedPdbId, style, colorScheme);
      };
      
      const handleSurfaceToggle = () => {
        setShowSurface(prev => !prev);
        if (selectedPdbId) loadPDBStructure(selectedPdbId, style, colorScheme);
      };

      const handleStyleChange = (e) => {
        const newStyle = e.target.value;
        setStyle(newStyle);
        if (selectedPdbId) loadPDBStructure(selectedPdbId, newStyle, colorScheme);
      };
      
      const handleColorChange = (e) => {
        const newColor = e.target.value;
        setColorScheme(newColor);
        if (selectedPdbId) loadPDBStructure(selectedPdbId, style, newColor);
      };

      const resetCamera = () => {
        if (window.currentViewer) {
          window.currentViewer.zoomTo();
          window.currentViewer.render();
        }
      };

    


    
    return(
        <div style={{ padding: '2rem', color: 'black' }}>
           
            
            <div className="protein-search">
            <h2>Protein Search</h2>
            <input
                type="text"
                placeholder="Enter UniProt ID (e.g., P12314)"
                value={uniport}
                onChange={(e) => setUniport(e.target.value)}
            />
            <button onClick={protein_search}>Search</button>



            <div style={{ marginTop: '1rem' }}>
                <label>
                  <input type="checkbox" checked={showAxes} onChange={handleAxesToggle} />
                  Show Axes
                </label>
                <label style={{ marginLeft: '1rem' }}>
                  <input type="checkbox" checked={showLabels} onChange={handleLabelsToggle} />
                  Show Labels
                </label>
                <label style={{ marginLeft: '1rem' }}>
                  <input type="checkbox" checked={showSurface} onChange={handleSurfaceToggle} />
                  Show Surface
                </label>
                <button style={{ marginLeft: '2rem' }} onClick={resetCamera}>
                  🔄 Reset Camera
                </button>
            </div>
            {sequence && (
                <div style={{ marginTop: '1rem' }}>
                    <strong>Protein Info:</strong> {info}<br />
                    <strong>Sequence:</strong> {sequence}
                    <button onClick={copyToClipboard} style={{ marginLeft: '10px' }}>
                        📋 Copy
                    </button>
                </div>
            )}
            {pdbId.length > 0 && (
                <div style={{ marginTop: '2rem' }}>
                  <label htmlFor="pdbDropdown">Structure:</label>
                  <select
                    id="pdbDropdown"
                    value={selectedPdbId}
                    onChange={(e) => {
                      const newId = e.target.value;
                      setSelectedPdbId(newId);
                      loadPDBStructure(newId, style, colorScheme);
                    }}
                  >
                    {pdbId.map((id) => (
                      <option key={id} value={id}>
                        {id}
                      </option>
                    ))}
                  </select>
                    
                  <label htmlFor="styleDropdown" style={{ marginLeft: '1rem' }}>Style:</label>
                  <select id="styleDropdown" value={style} onChange={handleStyleChange}>
                    <option value="cartoon">Cartoon</option>
                    <option value="stick">Stick</option>
                    <option value="sphere">Sphere</option>
                    <option value="line">Line</option>
                  </select>
                    
                  <label htmlFor="colorDropdown" style={{ marginLeft: '1rem' }}>Color:</label>
                  <select id="colorDropdown" value={colorScheme} onChange={handleColorChange}>
                    <option value="spectrum">Spectrum</option>
                    <option value="whiteCarbon">White Carbon</option>
                    <option value="element">Element</option>
                    <option value="greenCarbon">Green Carbon</option>
                  </select>
                    
                  <div
                    id="viewer"
                    style={{
                      width: '100%',
                     
                      height: '600px',
                      marginTop: '1rem',
                      border: '1px solid #ccc',
                      position: 'relative',
                    }}
                  ></div>
                </div>
            )}

        </div>
        </div>

       
        
    
        

    );
}

export default Glygen;