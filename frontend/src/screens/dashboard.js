import React from "react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import '../styles/dashboard.css';

function Dashboard(){
    
    
    return(
        <div style={{ padding: '2rem', color: 'black' }}>
            <header className="dashboard-header">
                <h1>Ole Miss </h1>
                <h1>Biomedical Engineering</h1>
                
            </header>
            <p>Welcome to the Dashboard!</p>
            
        </div>

       
        
    
        

    );
}

export default Dashboard;


