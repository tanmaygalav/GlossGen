import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
// FIX: Import Transition type from framer-motion to explicitly type the transition object.
import { motion, AnimatePresence, type Transition } from 'framer-motion';
import { analyzeProfile } from '../services/githubService';
import { type ProfileAnalysisResult, type RepoInfo, type Badge } from '../types';

import HealthScoreGauge from '../components/profile/HealthScoreGauge';
import BadgeCard from '../components/profile/BadgeCard';
import RepoCard from '../components/profile/RepoCard';

const LANGUAGE_COLORS: { [key: string]: string } = {
  JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572A5',
  Java: '#b07219', HTML: '#e34c26', CSS: '#563d7c', Go: '#00ADD8',
  Rust: '#dea584', Shell: '#89e051', C: '#555555', 'C++': '#f34b7d',
  Ruby: '#701516', PHP: '#4F5D95', Swift: '#F05138', Kotlin: '#A97BFF',
  'Jupyter Notebook': '#DA5B0B', Other: '#6e6e6e'
};

const LoadingSpinner: React.FC = () => (
    <div className="flex flex-col items-center justify-center text-center">
        <motion.div 
            className="w-12 h-12 border-2 border-gray-800 border-t-accent" 
            style={{borderRightColor: 'transparent', borderBottomColor: 'transparent', borderRadius: '50%'}}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <p className="mt-4 text-gray-400">Analyzing profile...</p>
        <p className="text-sm text-gray-600">This might take a moment.</p>
    </div>
);

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => {
    return (
        <button
            onClick={onClick}
            className={`relative px-4 py-2 text-sm font-bold transition-colors duration-300 rounded-md focus:outline-none ${active ? 'text-white' : 'text-gray-400 hover:text-white'}`}
        >
            {children}
            {active && (
                <motion.div
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"
                    layoutId="underline"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
            )}
        </button>
    );
};

const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 },
};

// FIX: Explicitly type pageTransition to prevent type inference issues with string literals.
const pageTransition: Transition = {
    type: 'tween',
    ease: 'anticipate',
    duration: 0.4,
};

const listContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.07,
        },
    },
};

const ProfileResultsPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const profileUrl = searchParams.get('user') || '';

    const [analysisResult, setAnalysisResult] = useState<ProfileAnalysisResult | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'repositories' | 'achievements'>('overview');

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
        return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>;
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center text-center p-4">
                <div>
                    <h2 className="text-2xl text-red-500">Analysis Failed</h2>
                    <p className="text-gray-400 mt-2">{error}</p>
                    <a href="/#" className="mt-6 inline-block bg-accent text-black font-bold p-3 px-6 hover:bg-orange-400 transition-colors rounded-lg">Try Again</a>
                </div>
            </div>
        );
    }

    if (!analysisResult) return null;
    
    const { 
        name, login, avatarUrl, bio, followers, following, publicRepoCount,
        healthScore, profileSummary, mainExpertise, topRepos, badges, suggestions
    } = analysisResult;

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-8 font-sans">
            <header className="mb-8 flex justify-between items-center">
                <Link to="/" className="text-2xl font-bold tracking-tighter hover:text-accent transition-colors">GlossGen</Link>
                <button 
                    onClick={() => navigate(-1)} 
                    className="flex items-center gap-2 bg-gray-900/50 text-white font-bold py-2 px-4 hover:bg-gray-800 transition-colors border border-white/10 text-sm rounded-lg"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back
                </button>
            </header>

            <main>
                <div className="flex flex-col sm:flex-row items-start gap-6 sm:gap-8 mb-8">
                    <motion.img 
                        src={avatarUrl} alt={login} 
                        className="w-32 h-32 sm:w-40 sm:h-40 border-4 border-gray-800 rounded-2xl shadow-lg" 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                    />
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

                <nav className="border-b border-white/10 mb-8 flex items-center gap-4">
                    <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>Overview</TabButton>
                    <TabButton active={activeTab === 'repositories'} onClick={() => setActiveTab('repositories')}>Repositories</TabButton>
                    <TabButton active={activeTab === 'achievements'} onClick={() => setActiveTab('achievements')}>Achievements</TabButton>
                </nav>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        variants={pageVariants}
                        initial="initial"
                        animate="in"
                        exit="out"
                        transition={pageTransition}
                    >
                        {activeTab === 'overview' && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 space-y-8">
                                    <div className="border border-white/10 bg-gray-950/40 backdrop-blur-sm p-6 rounded-xl shadow-lg">
                                        <h2 className="text-sm font-bold text-gray-500 tracking-wider uppercase mb-4">AI Summary</h2>
                                        <p className="text-gray-300 leading-relaxed">{profileSummary}</p>
                                    </div>
                                    <div className="border border-white/10 bg-gray-950/40 backdrop-blur-sm p-6 rounded-xl shadow-lg">
                                        <h2 className="text-sm font-bold text-gray-500 tracking-wider uppercase mb-4">Improvement Suggestions</h2>
                                        <ul className="space-y-3">
                                          {suggestions.map((tip, i) => (
                                            <li key={i} className="flex items-start gap-3">
                                              <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                              <span className="text-gray-300">{tip}</span>
                                            </li>
                                          ))}
                                        </ul>
                                    </div>
                                </div>
                                <div className="space-y-8">
                                     <div className="border border-white/10 bg-gray-950/40 backdrop-blur-sm p-6 rounded-xl shadow-lg text-center">
                                        <h2 className="text-sm font-bold text-gray-500 tracking-wider uppercase mb-4">Profile Health</h2>
                                        <HealthScoreGauge score={healthScore} />
                                    </div>
                                    <div className="border border-white/10 bg-gray-950/40 backdrop-blur-sm p-6 rounded-xl shadow-lg">
                                        <h2 className="text-sm font-bold text-gray-500 tracking-wider uppercase mb-4">Main Expertise</h2>
                                        <div className="flex flex-wrap gap-2">
                                            {mainExpertise.map(tech => (
                                                <span key={tech} className="bg-gray-800 text-gray-300 text-sm font-mono px-3 py-1 border border-gray-700 rounded-md">{tech}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        {activeTab === 'repositories' && (
                           <div>
                               <h2 className="text-2xl font-bold mb-6">Top Repositories</h2>
                               <motion.div 
                                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                                  variants={listContainerVariants}
                                  initial="hidden"
                                  animate="visible"
                                >
                                   {topRepos.map((repo) => <RepoCard key={repo.name} repo={repo} languageColor={LANGUAGE_COLORS[repo.language || ''] || LANGUAGE_COLORS.Other} />)}
                               </motion.div>
                           </div>
                        )}
                        {activeTab === 'achievements' && (
                            <div>
                               <h2 className="text-2xl font-bold mb-6">Badges</h2>
                               <motion.div 
                                  className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
                                  variants={listContainerVariants}
                                  initial="hidden"
                                  animate="visible"
                                >
                                   {badges.map((badge) => <BadgeCard key={badge.id} badge={badge} />)}
                               </motion.div>
                           </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </main>
            <footer className="text-center py-8 mt-12 border-t border-white/10 text-gray-600 text-xs font-mono">
                <p>&copy; {new Date().getFullYear()} Tanmay galav. All Rights Reserved.</p>
            </footer>
        </div>
    );
};

export default ProfileResultsPage;