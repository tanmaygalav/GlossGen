
import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ResultsPage from './pages/ResultsPage';
import ProfileResultsPage from './pages/ProfileResultsPage';

function App() {
  return (
    <div className="bg-black text-white font-sans min-h-screen">
      <HashRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/analyze" element={<HomePage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/profile" element={<ProfileResultsPage />} />
        </Routes>
      </HashRouter>
    </div>
  );
}

export default App;