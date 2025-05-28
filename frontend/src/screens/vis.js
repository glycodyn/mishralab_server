import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import '../styles/dashboard.css';

function Vis(){
    const [file, setFile] = useState(null);
    const navigate = useNavigate();

    const handleFileChange = (event) => {
        setFile(event.target.files[0]);
    };

    const handleUpload = () => {
        const formData = new FormData();
        formData.append('file', file);

        fetch('https://dummy-api.com/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            // Handle response as needed
        })
        .catch(error => {
            // Handle error
        });
    };

    return(
        <div style={{ padding: '2rem', color: 'black' }}>
           
            <input type="file" onChange={handleFileChange} />
            <button onClick={handleUpload}>Upload</button>
        </div>
    );
}

export default Vis;