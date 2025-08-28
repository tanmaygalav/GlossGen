import React from 'react';
// FIX: Import Variants type from framer-motion to explicitly type the variants object.
import { motion, type Variants } from 'framer-motion';
import { type Badge } from '../../types';

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

const BadgeIcon: React.FC<{ id: Badge['id'] }> = ({ id }) => {
    const icons: Record<Badge['id'], string> = {
        POLYGLOT: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 002-2v-1a2 2 0 012-2h1.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h3A2.5 2.5 0 0016 5.5V3.935m0 14.13V18.5A2.5 2.5 0 0013.5 16h-3a2.5 2.5 0 00-2.5 2.5v1.585",
        STAR_GAZER: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z",
        COMMIT_MACHINE: "M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7.014A8.003 8.003 0 0117.657 18.657z M9.879 16.121A3 3 0 1014.12 11.879A3 3 0 009.879 16.121z",
        PERFECT_README: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
        COMMUNITY_BUILDER: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
        TOP_10_PERCENT: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
    };

    return (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d={icons[id]} />
        </svg>
    );
};


const BadgeCard: React.FC<{ badge: Badge }> = ({ badge }) => {
    return (
        <motion.div
            className={`group relative border rounded-xl p-4 flex flex-col items-center justify-center text-center transition-all duration-300 ${badge.earned ? 'border-accent/50 bg-accent/10 text-gray-200 shadow-lg shadow-accent/10 hover:shadow-accent/20' : 'border-white/10 bg-gray-950/40 text-gray-500'}`}
            variants={cardVariants}
        >
            <div className={`transition-transform duration-300 ${badge.earned ? 'group-hover:scale-110' : ''}`}>
                <BadgeIcon id={badge.id} />
            </div>
            <h3 className={`mt-3 font-bold text-sm ${badge.earned ? 'text-white' : 'text-gray-500'}`}>{badge.name}</h3>

            {/* Tooltip */}
            <div className="absolute bottom-full z-10 mb-2 w-48 p-2 text-xs text-center text-white bg-gray-800 border border-white/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                {badge.description}
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45 border-r border-b border-white/10"></div>
            </div>
        </motion.div>
    );
};

export default BadgeCard;