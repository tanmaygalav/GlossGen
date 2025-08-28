import React, { useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

const HealthScoreGauge: React.FC<{ score: number }> = ({ score }) => {
    const circumference = 2 * Math.PI * 45; // 2 * pi * r
    const strokeDashoffset = circumference - (score / 100) * circumference;
    
    const count = useMotionValue(0);
    const rounded = useTransform(count, Math.round);

    useEffect(() => {
        const animation = animate(count, score, {
            duration: 1.5,
            delay: 0.5,
            ease: "easeOut",
        });
        return animation.stop;
    }, [score, count]);

    const getColor = (s: number) => {
        if (s < 40) return '#ef4444'; // red-500
        if (s < 70) return '#f97316'; // orange-500
        return '#22c55e'; // green-500
    };
    const color = getColor(score);

    return (
        <div className="relative inline-flex items-center justify-center w-48 h-48">
            <svg className="w-full h-full" viewBox="0 0 100 100">
                {/* Background circle */}
                <circle
                    className="text-gray-800"
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                    r="45"
                    cx="50"
                    cy="50"
                />
                {/* Progress circle */}
                <motion.circle
                    strokeWidth="8"
                    stroke={color}
                    fill="transparent"
                    r="45"
                    cx="50"
                    cy="50"
                    strokeLinecap="round"
                    style={{ rotate: -90, transformOrigin: '50% 50%' }}
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{
                        duration: 1.5,
                        delay: 0.5,
                        ease: "easeOut",
                    }}
                />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
                <motion.span
                    className="text-4xl font-bold font-mono"
                    style={{ color }}
                >
                    {rounded}
                </motion.span>
                <span className="text-xs text-gray-500 uppercase tracking-wider">Score</span>
            </div>
        </div>
    );
};

export default HealthScoreGauge;