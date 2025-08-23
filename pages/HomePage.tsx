
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Scene from '../components/Scene';

const HomePage: React.FC = () => {
  const [repoUrl, setRepoUrl] = useState('https://github.com/facebook/react');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!repoUrl) {
      setError('Please enter a GitHub repository URL.');
      return;
    }
    setError('');
    setIsLoading(true);
    
    // Basic validation
    try {
        const url = new URL(repoUrl);
        if (url.hostname !== 'github.com') {
            throw new Error();
        }
    } catch (_) {
        setError('Please enter a valid GitHub URL.');
        setIsLoading(false);
        return;
    }

    navigate(`/results?repo=${encodeURIComponent(repoUrl)}`);
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
          Generate a fully-searchable code glossary from any public GitHub repository.
        </p>
        <p className="text-gray-400 mb-8 max-w-md mx-auto">
          By-Tanmay Galav
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="e.g., https://github.com/facebook/react"
            className="w-full bg-black border border-gray-800 text-white p-4 focus:outline-none focus:border-accent font-mono text-sm"
            disabled={isLoading}
          />
          {error && <p className="text-red-500 text-sm text-left">{error}</p>}
          <button
            type="submit"
            className="w-full bg-accent text-black font-bold p-4 hover:bg-white focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-black transition-colors duration-200 disabled:bg-gray-700 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? 'Generating...' : 'Generate'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default HomePage;
