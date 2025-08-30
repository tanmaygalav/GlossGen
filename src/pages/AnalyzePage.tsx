
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Scene from '../components/Scene';

const AnalyzePage: React.FC = () => {
  type AnalysisType = 'repo' | 'profile';
  const [analysisType, setAnalysisType] = useState<AnalysisType>('profile');
  const [repoUrl, setRepoUrl] = useState('https://github.com/facebook/react');
  const [profileUrl, setProfileUrl] = useState('https://github.com/gaearon');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Analyze | GlossGen';
  }, []);
  
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
    
    try {
        const url = new URL(currentUrl);
        if (url.hostname !== 'github.com') throw new Error();
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
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden p-4">
      <header className="absolute top-0 left-0 w-full z-20 p-4 sm:p-8">
          <Link to="/" className="text-2xl font-bold tracking-tighter hover:text-accent transition-colors">
              GlossGen
          </Link>
      </header>
      <div className="absolute top-0 left-0 w-full h-full z-0">
        <Scene />
      </div>

      <div className="relative z-10 w-full max-w-2xl bg-gray-950/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6 sm:p-8 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tighter mb-4" style={{textShadow: '0 0 15px rgba(255, 255, 255, 0.2)'}}>
          Analyze Anything
        </h1>
        <p className="text-gray-300 mb-8 max-w-md mx-auto">
          Generate a code glossary from a public repository or get a deep analysis of a developer's profile.
        </p>

        <div className="flex justify-center mb-8 bg-black/20 border border-white/10 rounded-full p-1 max-w-xs mx-auto">
            <button onClick={() => setAnalysisType('repo')} className={`w-full p-2 text-sm font-bold rounded-full transition-all duration-300 ${isRepoMode ? 'bg-accent text-black shadow-md shadow-accent/30' : 'bg-transparent text-white hover:bg-white/5'}`}>
                Repository
            </button>
            <button onClick={() => setAnalysisType('profile')} className={`w-full p-2 text-sm font-bold rounded-full transition-all duration-300 ${!isRepoMode ? 'bg-accent text-black shadow-md shadow-accent/30' : 'bg-transparent text-white hover:bg-white/5'}`}>
                Profile
            </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            value={currentUrl}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-black/40 border border-white/10 text-white p-4 rounded-lg focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/50 font-mono text-sm transition-all duration-300"
            disabled={isLoading}
            aria-label={`GitHub ${isRepoMode ? 'Repository' : 'Profile'} URL`}
          />
          {error && <p className="text-red-400 text-sm text-left">{error}</p>}
          <button
            type="submit"
            className="w-full bg-accent text-black font-bold p-4 rounded-lg shadow-lg shadow-accent/20 hover:bg-orange-400 hover:shadow-xl hover:shadow-accent/40 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-300 ease-in-out transform hover:scale-[1.02] disabled:bg-gray-700 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none"
            disabled={isLoading}
          >
            {isLoading ? (
                <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-black/50 border-t-black rounded-full animate-spin mr-2"></div>
                    Analyzing...
                </div>
            ) : ( <>Analyze <span className="hidden sm:inline">{isRepoMode ? 'Repository' : 'Profile'}</span> </>)}
          </button>
        </form>
      </div>
       <p className="absolute bottom-8 text-xs text-gray-500 font-mono">
          &copy; {new Date().getFullYear()} <a href="https://github.com/Vitiantanmay" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">Tanmay galav</a>.
        </p>
    </div>
  );
};

export default AnalyzePage;