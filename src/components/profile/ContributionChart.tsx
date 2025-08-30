
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type ContributionDay } from '../../types';

const ContributionDaySquare: React.FC<{ day: ContributionDay | null; onHover: (day: ContributionDay | null) => void }> = ({ day, onHover }) => {
    const levelColors = [
        'bg-gray-800/50', // Level 0
        'bg-green-900',   // Level 1
        'bg-green-700',   // Level 2
        'bg-green-500',   // Level 3
        'bg-green-300',   // Level 4
    ];

    if (!day) {
        return <div className="w-3 h-3 rounded-sm" />;
    }

    return (
        <div
            className={`w-3 h-3 rounded-sm cursor-pointer ${levelColors[day.level]} transition-transform duration-150 hover:scale-125`}
            onMouseEnter={() => onHover(day)}
            onMouseLeave={() => onHover(null)}
        />
    );
};

const ContributionChart: React.FC<{ data: ContributionDay[] }> = ({ data }) => {
    const [tooltip, setTooltip] = useState<{ day: ContributionDay; x: number; y: number } | null>(null);

    const handleHover = (day: ContributionDay | null) => {
        if (day) {
            const el = document.querySelector(`[data-date='${day.date}']`);
            if (el) {
                const rect = el.getBoundingClientRect();
                setTooltip({ day, x: rect.left + window.scrollX, y: rect.top + window.scrollY });
            }
        } else {
            setTooltip(null);
        }
    };
    
    // Prepare data for rendering
    const today = new Date();
    const endDate = new Date(today.setDate(today.getDate() + (6 - today.getDay()))); // End on the next Saturday
    const startDate = new Date(new Date(endDate).setDate(endDate.getDate() - 370)); // Approx 53 weeks
    
    const contributionsByDate = new Map(data.map(d => [d.date, d]));
    
    const weeks = [];
    let currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() - currentDate.getDay()); // Start on a Sunday

    for (let i = 0; i < 53; i++) {
        const week = [];
        for (let j = 0; j < 7; j++) {
            const dateStr = currentDate.toISOString().split('T')[0];
            week.push(contributionsByDate.get(dateStr) || { date: dateStr, count: 0, level: 0 });
            currentDate.setDate(currentDate.getDate() + 1);
        }
        weeks.push(week);
    }
    
    const monthLabels = weeks.reduce((acc, week, i) => {
        const firstDayOfMonth = new Date(week[0].date).getDate() <= 7;
        const monthName = new Date(week[0].date).toLocaleString('default', { month: 'short' });
        if (firstDayOfMonth && acc[acc.length - 1]?.name !== monthName) {
            acc.push({ name: monthName, index: i });
        }
        return acc;
    }, [] as { name: string, index: number }[]);

    return (
        <div className="font-mono text-xs text-gray-400">
            <div className="relative overflow-hidden pb-4">
                 <div className="flex justify-start gap-1 ml-6 mb-2">
                    {monthLabels.map(m => (
                        <div key={m.name} className="absolute" style={{ left: `${(m.index * 16)}px`}}>
                            {m.name}
                        </div>
                    ))}
                </div>
                <div className="flex gap-1 mt-6">
                    <div className="flex flex-col gap-3.5 pt-0.5 mr-1">
                        <span>Mon</span>
                        <span>Wed</span>
                        <span>Fri</span>
                    </div>
                    {weeks.map((week, weekIndex) => (
                        <div key={weekIndex} className="flex flex-col gap-1">
                            {week.map((day, dayIndex) => (
                                <div key={day.date} data-date={day.date} onMouseEnter={() => handleHover(day)} onMouseLeave={() => handleHover(null)}>
                                     <div className={`w-3 h-3 rounded-sm ${['bg-gray-800/50', 'bg-green-900', 'bg-green-700', 'bg-green-500', 'bg-green-300'][day.level]} transition-transform duration-150 hover:scale-125`} />
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
            <div className="flex justify-end items-center gap-2 mt-2">
                 <span>Less</span>
                 <div className="w-3 h-3 rounded-sm bg-gray-800/50"></div>
                 <div className="w-3 h-3 rounded-sm bg-green-900"></div>
                 <div className="w-3 h-3 rounded-sm bg-green-700"></div>
                 <div className="w-3 h-3 rounded-sm bg-green-500"></div>
                 <div className="w-3 h-3 rounded-sm bg-green-300"></div>
                 <span>More</span>
            </div>

            <AnimatePresence>
                {tooltip && (
                    <motion.div
                        className="absolute z-10 p-2 text-xs text-center text-white bg-gray-900 border border-white/10 rounded-md shadow-lg"
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.9 }}
                        style={{
                            top: `${tooltip.y - 45}px`,
                            left: `${tooltip.x - 50}px`,
                        }}
                    >
                        <strong>{tooltip.day.count} contributions</strong> on {new Date(tooltip.day.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ContributionChart;
