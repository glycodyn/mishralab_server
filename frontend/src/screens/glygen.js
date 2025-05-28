import React from "react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import '../styles/dashboard.css';

function Glygen(){
    const[uniport, setUniport] = useState('');
    const [listid, setListid] = useState('');
    const protein_search = async() => {
        try{
            const res = await fetch('https://api.glygen.org/protein/search/',{
                method: 'POST',
                headers:{
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(
                    {"uniprot_canonical_ac": uniport}
                ),    
            });
            const result = await res.json();
            
            if(res.ok){
                console.log(result);
                setListid(result.list_id)
            } else {
                console.error('Error fetching data:', result);
            }
        }catch(error){
            console.error('Error:', error);
        }
    }

    const protein_list_search = async()=>{
        try{
            const res = await fetch('https://api.glygen.org/protein/list/',{
                method: 'POST',
                headers:{
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(
                    {"id": listid}
                ),    
            });
            const result = await res.json();
            if(res.ok){
                console.log(result);

            }
        }catch{}
    }

    const copyToClipboard = () => {
        navigator.clipboard.writeText(listid)
            .then(() => alert("Copied to clipboard!"))
            .catch(() => alert("Failed to copy."));
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

            {listid && (
                <div style={{ marginTop: '1rem' }}>
                    <strong>List ID:</strong> {listid}
                    <button onClick={copyToClipboard} style={{ marginLeft: '10px' }}>
                        📋 Copy
                    </button>
                </div>
            )}
        </div>
        </div>

       
        
    
        

    );
}

export default Glygen;