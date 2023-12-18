import React from 'react';
import CameraCapture from './CameraCapture'; // Assuming CameraCapture is in a file named CameraCapture.js

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Nonverb</h1>
      </header>
      <main>
        <CameraCapture />
      </main>
    </div>
  );
}

export default App;
