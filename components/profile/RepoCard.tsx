import React from 'react';
// FIX: Import Variants type from framer-motion to explicitly type the variants object.
import { motion, type Variants } from 'framer-motion';
import { type RepoInfo } from '../../types';

// FIX: Explicitly type cardVariants to prevent type inference issues with string literals.
const cardVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.5,
            ease: "easeOut",
        },
    },
};

const RepoCard: React.FC<{ repo: RepoInfo; languageColor: string }> = ({ repo, languageColor }) => {
    return (
        <motion.a
            href={repo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col p-6 border border-white/10 bg-gray-950/40 rounded-xl transition-all duration-300 shadow-lg hover:shadow-lg hover:shadow-accent/20 hover:border-accent/60"
            variants={cardVariants}
        >
            <div className="flex-grow">
                <div className="flex justify-between items-start mb-2">
                    <span className="text-accent font-bold font-mono truncate pr-4 group-hover:text-orange-400 transition-colors">{repo.name}</span>
                    <div className="flex items-center gap-2 text-sm text-gray-400 flex-shrink-0">
                        <span>{repo.stars.toLocaleString()}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279L12 18.896l-7.416 4.517 1.48-8.279-6.064-5.828 8.332-1.151z"/></svg>
                    </div>
                </div>
                <p className="text-sm font-semibold text-gray-200 mb-2 italic">{`"${repo.pitch}"`}</p>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">{repo.description || ''}</p>
            </div>

            <div className="flex items-center gap-4 text-xs mt-auto pt-2 border-t border-white/5">
                {repo.language && (
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: languageColor }}></span>
                        <span className="text-gray-300 font-mono">{repo.language}</span>
                    </div>
                )}
                 <div className="flex items-center gap-2">
                    <span className="text-gray-500">AI Quality:</span>
                    <span className="font-mono text-white">{repo.qualityScore}</span>
                </div>
            </div>
        </motion.a>
    );
};

export default RepoCard;