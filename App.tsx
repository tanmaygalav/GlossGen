
import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ResultsPage from './pages/ResultsPage';

function App() {
  return (
    <div className="bg-black text-white font-sans min-h-screen">
      <HashRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/results" element={<ResultsPage />} />
        </Routes>
      </HashRouter>
    </div>
  );
}

export default App;
