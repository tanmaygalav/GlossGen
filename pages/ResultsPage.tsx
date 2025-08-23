
import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { analyzeRepo } from '../services/githubService';
import { GlossaryItemType, type AnalysisResult, type GlossaryItem } from '../types';

const LoadingSpinner: React.FC = () => (
    <div className="flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 border-2 border-gray-800 border-t-accent animate-spin" style={{borderRightColor: 'transparent', borderBottomColor: 'transparent', borderRadius: '50%'}}></div>
        <p className="mt-4 text-gray-400">Analyzing repository...</p>
        <p className="text-sm text-gray-600">This might take a moment.</p>
    </div>
);

const TypeBadge: React.FC<{ type: GlossaryItemType }> = ({ type }) => {
  const colors = {
    [GlossaryItemType.Function]: 'bg-blue-900/50 text-blue-300 border-blue-700',
    [GlossaryItemType.Class]: 'bg-purple-900/50 text-purple-300 border-purple-700',
    [GlossaryItemType.Variable]: 'bg-green-900/50 text-green-300 border-green-700',
  };
  return (
    <span className={`px-2 py-1 text-xs font-mono border ${colors[type]}`}>
      {type}
    </span>
  );
};

const Star: React.FC<{ filled: number }> = ({ filled }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5 text-accent">
        <defs>
            <linearGradient id={`grad-${filled}`}>
                <stop offset={`${filled * 100}%`} stopColor="currentColor" />
                <stop offset={`${filled * 100}%`} stopColor="#404040" />
            </linearGradient>
        </defs>
        <path fill={`url(#grad-${filled})`} d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279L12 18.896l-7.416 4.517 1.48-8.279-6.064-5.828 8.332-1.151z"/>
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

const RepoSummary: React.FC<{ result: AnalysisResult }> = ({ result }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="border border-gray-800 bg-gray-900/20 p-4">
            <h4 className="text-sm font-bold text-gray-500 mb-2 tracking-wider uppercase">Rating</h4>
            <div className="flex items-center gap-2">
                <StarRating rating={result.starRating} />
                <span className="text-xl font-mono font-bold">{result.starRating.toFixed(1)}</span>
            </div>
        </div>
        <div className="border border-gray-800 bg-gray-900/20 p-4">
            <h4 className="text-sm font-bold text-gray-500 mb-2 tracking-wider uppercase">Commits</h4>
            <p className="text-2xl font-bold font-mono">{result.commitCount.toLocaleString()}</p>
        </div>
        <div className="border border-gray-800 bg-gray-900/20 p-4 col-span-1 md:col-span-2 lg:col-span-1">
             <h4 className="text-sm font-bold text-gray-500 mb-2 tracking-wider uppercase">Tech Stack</h4>
             <div className="flex flex-wrap gap-2 pt-1">
                {result.techStack.map(tech => (
                    <span key={tech} className="bg-gray-800 text-gray-300 text-xs font-mono px-2 py-1 border border-gray-700">{tech}</span>
                ))}
             </div>
        </div>
        <div className="border border-gray-800 bg-gray-900/20 p-4 col-span-1 md:col-span-2 lg:col-span-1">
             <h4 className="text-sm font-bold text-gray-500 mb-2 tracking-wider uppercase">File Structure</h4>
             <p className="text-sm text-gray-400">{result.fileStructureSummary}</p>
        </div>
    </div>
);


const ResultsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const repoUrl = searchParams.get('repo') || '';

  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<GlossaryItemType[]>([]);

  useEffect(() => {
    if (!repoUrl) {
      setError('No repository URL provided.');
      setIsLoading(false);
      return;
    }

    const fetchGlossary = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await analyzeRepo(repoUrl);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    fetchGlossary();
  }, [repoUrl]);
  
  const toggleFilter = (filter: GlossaryItemType) => {
    setActiveFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  const filteredItems = useMemo(() => {
    if (!analysisResult) return [];
    return analysisResult.items
      .filter(item => {
        const searchMatch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            item.path.toLowerCase().includes(searchTerm.toLowerCase());
        const filterMatch = activeFilters.length === 0 || activeFilters.includes(item.type);
        return searchMatch && filterMatch;
      });
  }, [analysisResult, searchTerm, activeFilters]);

  const exportToMarkdown = () => {
    if (!analysisResult) return;

    let markdownContent = `# Glossary for ${analysisResult.repoName}\n\n`;

    const groupedItems = filteredItems.reduce((acc, item) => {
        if (!acc[item.type]) {
            acc[item.type] = [];
        }
        acc[item.type].push(item);
        return acc;
    }, {} as Record<GlossaryItemType, GlossaryItem[]>);

    for (const type in groupedItems) {
        markdownContent += `## ${type}s\n\n`;
        groupedItems[type as GlossaryItemType].forEach(item => {
            markdownContent += `- \`${item.name}\` - *${item.path}*\n`;
        });
        markdownContent += '\n';
    }

    const blob = new Blob([markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `glossgen-${analysisResult.repoName.replace('/', '_')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-8">
      <header className="mb-8">
        <p className="text-gray-500">Glossary For</p>
        <h1 className="text-3xl sm:text-4xl font-bold break-all mb-4">{analysisResult?.repoName}</h1>
        {analysisResult && <RepoSummary result={analysisResult} />}
      </header>

      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md py-4 mb-8 border-b border-gray-800">
        <div className="flex flex-col md:flex-row gap-4">
            <input
                type="text"
                placeholder="Search by name or path..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-grow bg-black border border-gray-800 text-white p-3 focus:outline-none focus:border-accent font-mono text-sm"
            />
            <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-gray-500 hidden md:block">Filter:</span>
                {Object.values(GlossaryItemType).map(type => (
                    <button
                        key={type}
                        onClick={() => toggleFilter(type)}
                        className={`border px-3 py-2 text-sm transition-colors ${
                            activeFilters.includes(type)
                                ? 'bg-accent text-black border-accent'
                                : 'bg-black text-white border-gray-800 hover:border-gray-600'
                        }`}
                    >
                        {type}s
                    </button>
                ))}
            </div>
            <button
                onClick={exportToMarkdown}
                className="bg-gray-800 text-white font-bold p-3 px-6 hover:bg-gray-700 focus:outline-none transition-colors border border-gray-800"
            >
                Export MD
            </button>
        </div>
      </div>

      <div className="space-y-2">
        {filteredItems.length > 0 ? (
          filteredItems.map((item, index) => (
            <div key={`${item.name}-${index}`} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border border-gray-800 bg-gray-900/20 hover:border-gray-700 transition-colors">
              <div className="flex-1 mb-2 sm:mb-0">
                <h3 className="font-mono font-bold text-accent">{item.name}</h3>
                <p className="font-mono text-sm text-gray-500 break-all">{item.path}</p>
              </div>
              <div className="flex-shrink-0">
                <TypeBadge type={item.type} />
              </div>
            </div>
          ))
        ) : (
            <div className="text-center py-16 border border-dashed border-gray-800">
                <p className="text-gray-500">No results found.</p>
                <p className="text-sm text-gray-600">Try adjusting your search or filters.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default ResultsPage;
