
import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { analyzeProfile } from '../services/githubService';
import { type ProfileAnalysisResult, type LanguageDistribution, type RepoInfo } from '../types';

const LANGUAGE_COLORS: { [key: string]: string } = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Java: '#b07219',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Go: '#00ADD8',
  Rust: '#dea584',
  Shell: '#89e051',
  C: '#555555',
  'C++': '#f34b7d',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  'Jupyter Notebook': '#DA5B0B',
  Other: '#6e6e6e'
};

const LoadingSpinner: React.FC = () => (
    <div className="flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 border-2 border-gray-800 border-t-accent animate-spin" style={{borderRightColor: 'transparent', borderBottomColor: 'transparent', borderRadius: '50%'}}></div>
        <p className="mt-4 text-gray-400">Analyzing profile...</p>
        <p className="text-sm text-gray-600">This might take a moment.</p>
    </div>
);

const Star: React.FC<{ filled: number }> = ({ filled }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5 text-accent">
        <defs>
            <linearGradient id={`grad-profile-${filled}`}>
                <stop offset={`${filled * 100}%`} stopColor="currentColor" />
                <stop offset={`${filled * 100}%`} stopColor="#404040" />
            </linearGradient>
        </defs>
        <path fill={`url(#grad-profile-${filled})`} d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279L12 18.896l-7.416 4.517 1.48-8.279-6.064-5.828 8.332-1.151z"/>
    </svg>
);


const StarRating: React.FC<{ rating: number }> = ({ rating }) => {
    return (
        <div className="flex items-center">
            {[...Array(5)].map((_, index) => {
                const fill = Math.min(1, Math.max(0, rating - index));
                return <Star key={index} filled={fill} />;
            })}
        </div>
    );
};

const LanguageChart: React.FC<{ languages: LanguageDistribution }> = ({ languages }) => {
    const sortedLanguages = useMemo(() => {
        const total = Object.values(languages).reduce((sum, count) => sum + count, 0);
        if (total === 0) return [];
        return Object.entries(languages)
            .map(([name, count]) => ({
                name,
                percentage: (count / total) * 100,
                color: LANGUAGE_COLORS[name] || LANGUAGE_COLORS.Other
            }))
            .sort((a, b) => b.percentage - a.percentage)
            .slice(0, 7); // Show top 7 languages
    }, [languages]);

    if (sortedLanguages.length === 0) {
        return <p className="text-sm text-gray-500">No language data to display.</p>;
    }

    return (
        <div className="space-y-3">
            {sortedLanguages.map(lang => (
                <div key={lang.name} className="flex items-center gap-4">
                    <div className="w-28 text-sm text-gray-300 truncate font-mono">{lang.name}</div>
                    <div className="flex-1 bg-gray-800 h-4 border border-gray-700">
                        <div
                            className="h-full"
                            style={{ width: `${lang.percentage}%`, backgroundColor: lang.color }}
                            title={`${lang.name}: ${lang.percentage.toFixed(1)}%`}
                        ></div>
                    </div>
                    <div className="w-12 text-right text-xs text-gray-400 font-mono">{lang.percentage.toFixed(1)}%</div>
                </div>
            ))}
        </div>
    );
};


const ProfileResultsPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const profileUrl = searchParams.get('user') || '';

    const [analysisResult, setAnalysisResult] = useState<ProfileAnalysisResult | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!profileUrl) {
            setError('No profile URL provided.');
            setIsLoading(false);
            return;
        }

        const fetchProfileAnalysis = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const result = await analyzeProfile(profileUrl);
                setAnalysisResult(result);
            } catch (err) {
                if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError('An unknown error occurred.');
                }
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfileAnalysis();
    }, [profileUrl]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center text-center p-4">
                <div>
                    <h2 className="text-2xl text-red-500">Analysis Failed</h2>
                    <p className="text-gray-400 mt-2">{error}</p>
                    <a href="/#" className="mt-6 inline-block bg-accent text-black font-bold p-3 px-6 hover:bg-white transition-colors">
                        Try Again
                    </a>
                </div>
            </div>
        );
    }

    if (!analysisResult) {
        return null;
    }
    
    const { 
        name, login, avatarUrl, bio, followers, following, publicRepoCount, totalStars,
        starRating, profileSummary, mainExpertise, languageDistribution, topRepos
    } = analysisResult;

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-8">
            <header className="mb-8 flex justify-between items-center">
                <Link to="/" className="text-2xl font-bold tracking-tighter hover:text-accent transition-colors">
                    GlossGen
                </Link>
                <button 
                    onClick={() => navigate(-1)} 
                    className="flex items-center gap-2 bg-gray-800 text-white font-bold py-2 px-4 hover:bg-gray-700 transition-colors border border-gray-700 text-sm"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back
                </button>
            </header>

            <main>
                {/* Profile Header */}
                <div className="flex flex-col sm:flex-row items-start gap-6 sm:gap-8 mb-12">
                    <img src={avatarUrl} alt={login} className="w-32 h-32 sm:w-40 sm:h-40 border-4 border-gray-800" />
                    <div className="flex-1">
                        <h1 className="text-3xl sm:text-4xl font-bold">{name || login}</h1>
                        <p className="text-xl text-gray-500 font-mono">@{login}</p>
                        <p className="mt-4 text-gray-300 max-w-xl">{bio}</p>
                        <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-sm">
                            <span><span className="font-bold text-white">{followers.toLocaleString()}</span> followers</span>
                            <span><span className="font-bold text-white">{following.toLocaleString()}</span> following</span>
                            <span><span className="font-bold text-white">{publicRepoCount.toLocaleString()}</span> repositories</span>
                        </div>
                    </div>
                </div>

                {/* Analysis Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="border border-gray-800 bg-gray-900/20 p-6">
                            <h2 className="text-sm font-bold text-gray-500 tracking-wider uppercase mb-4">AI Summary</h2>
                            <p className="text-gray-300 leading-relaxed">{profileSummary}</p>
                        </div>
                         <div className="border border-gray-800 bg-gray-900/20 p-6">
                            <h2 className="text-sm font-bold text-gray-500 tracking-wider uppercase mb-4">Top Repositories</h2>
                            <div className="space-y-4">
                                {topRepos.map(repo => (
                                    <div key={repo.name} className="border-b border-gray-800 pb-4 last:border-b-0">
                                        <div className="flex justify-between items-start">
                                            <a href={repo.url} target="_blank" rel="noopener noreferrer" className="text-accent font-bold font-mono hover:underline truncate pr-4">{repo.name}</a>
                                            <div className="flex items-center gap-2 text-sm text-gray-400 flex-shrink-0">
                                                <span>{repo.stars}</span>
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279L12 18.896l-7.416 4.517 1.48-8.279-6.064-5.828 8.332-1.151z"/></svg>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-400 mt-1 mb-2 truncate">{repo.description}</p>
                                        {repo.language && <span className="text-xs font-mono px-2 py-1 border" style={{ color: LANGUAGE_COLORS[repo.language] || '#FFF', borderColor: LANGUAGE_COLORS[repo.language] || '#6e6e6e' }}>{repo.language}</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    {/* Right Column */}
                    <div className="space-y-8">
                         <div className="border border-gray-800 bg-gray-900/20 p-6">
                            <h2 className="text-sm font-bold text-gray-500 tracking-wider uppercase mb-4">Profile Rating</h2>
                            <div className="flex items-center gap-3">
                                <StarRating rating={starRating} />
                                <span className="text-3xl font-mono font-bold">{starRating.toFixed(1)}</span>
                            </div>
                        </div>
                        <div className="border border-gray-800 bg-gray-900/20 p-6">
                            <h2 className="text-sm font-bold text-gray-500 tracking-wider uppercase mb-4">Main Expertise</h2>
                            <div className="flex flex-wrap gap-2">
                                {mainExpertise.map(tech => (
                                    <span key={tech} className="bg-gray-800 text-gray-300 text-sm font-mono px-3 py-1 border border-gray-700">{tech}</span>
                                ))}
                            </div>
                        </div>
                        <div className="border border-gray-800 bg-gray-900/20 p-6">
                            <h2 className="text-sm font-bold text-gray-500 tracking-wider uppercase mb-4">Language Breakdown</h2>
                            <LanguageChart languages={languageDistribution} />
                        </div>
                    </div>
                </div>
            </main>
            <footer className="text-center py-8 mt-12 border-t border-gray-800 text-gray-600 text-xs font-mono">
                <p>&copy; {new Date().getFullYear()} Tanmay galav. All Rights Reserved.</p>
            </footer>
        </div>
    );
};

export default ProfileResultsPage;