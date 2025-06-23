const Header = ({children}) => {
    return (
      <header style={{
        backgroundColor: '#00008b',
        padding: '20px',
        color: 'red',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ margin: 0 }}>University of Mississippi</h1>
          <h2 style={{ margin: 0 }}>Biomedical Engineering</h2>
        </div>
        <div>
            {children}
        </div>
        
      </header>
    );
  };
  
  const navButtonStyle = {
    backgroundColor: 'blue',
    color: 'white',
    border: 'none',
    marginLeft: '10px',
    fontSize: '16px',
    cursor: 'pointer'
  };
  
  export default Header;