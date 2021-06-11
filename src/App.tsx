import React from 'react';
import './App.css';
import SceneViewer from './components/SceneViewer';
import Header from './components/Header';

function App() {
  return (
    <div style={{height: "100%", width: "100%"}}className="App">
        <Header/>
        <SceneViewer/>
    </div>
  );
}

export default App;
