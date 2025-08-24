
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Scene from '../components/Scene';

type AnalysisType = 'repo' | 'profile';

const HomePage: React.FC = () => {
  const [analysisType, setAnalysisType] = useState<AnalysisType>('repo');
  const [repoUrl, setRepoUrl] = useState('https://github.com/facebook/react');
  const [profileUrl, setProfileUrl] = useState('https://github.com/gaearon');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  const isRepoMode = analysisType === 'repo';
  const currentUrl = isRepoMode ? repoUrl : profileUrl;
  const setUrl = isRepoMode ? setRepoUrl : setProfileUrl;
  const placeholder = isRepoMode 
    ? "e.g., https://github.com/facebook/react"
    : "e.g., https://github.com/gaearon";


  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentUrl) {
      setError(`Please enter a GitHub ${isRepoMode ? 'repository' : 'profile'} URL.`);
      return;
    }
    setError('');
    setIsLoading(true);
    
    // Basic validation
    try {
        const url = new URL(currentUrl);
        if (url.hostname !== 'github.com') {
            throw new Error();
        }
        const pathParts = url.pathname.split('/').filter(Boolean);
        if (isRepoMode && pathParts.length < 2) {
           setError('Please enter a valid GitHub repository URL.');
           setIsLoading(false);
           return;
        }
        if (!isRepoMode && pathParts.length < 1) {
           setError('Please enter a valid GitHub profile URL.');
           setIsLoading(false);
           return;
        }
    } catch (_) {
        setError('Please enter a valid GitHub URL.');
        setIsLoading(false);
        return;
    }

    if (isRepoMode) {
        navigate(`/results?repo=${encodeURIComponent(currentUrl)}`);
    } else {
        navigate(`/profile?user=${encodeURIComponent(currentUrl)}`);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden p-4">
      <div className="absolute top-0 left-0 w-full h-full z-0 opacity-50">
        <Scene />
      </div>

      <div className="relative z-10 w-full max-w-2xl bg-black/50 backdrop-blur-sm border border-gray-800 p-8 sm:p-12 text-center">
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tighter mb-4">
          GlossGen
        </h1>
        <p className="text-gray-400 mb-8 max-w-md mx-auto">
          Generate a fully-searchable code glossary from any public GitHub repository or analyze a developer's profile.
        </p>

        <div className="flex justify-center mb-6 border border-gray-800 p-1">
            <button onClick={() => setAnalysisType('repo')} className={`w-full p-2 text-sm font-bold transition-colors duration-200 ${isRepoMode ? 'bg-accent text-black' : 'bg-transparent text-white hover:bg-gray-900'}`}>
                Repository
            </button>
            <button onClick={() => setAnalysisType('profile')} className={`w-full p-2 text-sm font-bold transition-colors duration-200 ${!isRepoMode ? 'bg-accent text-black' : 'bg-transparent text-white hover:bg-gray-900'}`}>
                Profile
            </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            value={currentUrl}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-black border border-gray-800 text-white p-4 focus:outline-none focus:border-accent font-mono text-sm"
            disabled={isLoading}
            aria-label={`GitHub ${isRepoMode ? 'Repository' : 'Profile'} URL`}
          />
          {error && <p className="text-red-500 text-sm text-left">{error}</p>}
          <button
            type="submit"
            className="w-full bg-accent text-black font-bold p-4 hover:bg-white focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-black transition-colors duration-200 disabled:bg-gray-700 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? 'Analyzing...' : `Analyze ${isRepoMode ? 'Repository' : 'Profile'}`}
          </button>
        </form>
        <p className="text-xs text-gray-600 mt-8 font-mono">
          &copy; {new Date().getFullYear()} Tanmay galav.
        </p>
      </div>
    </div>
  );
};

export default HomePage;