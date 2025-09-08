
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Scene from '../components/Scene';
import { motion, type Variants } from 'framer-motion';


const HomePage: React.FC = () => {
  useEffect(() => {
    document.title = 'GlossGen - AI Code Analyzer';
  }, []);

  const cardVariants: Variants = {
    offscreen: { y: 50, opacity: 0 },
    onscreen: { y: 0, opacity: 1, transition: { type: "spring", duration: 1 } }
  };
  
  return (
    <div className="relative w-full overflow-x-hidden text-white bg-black">
      <div className="absolute top-0 left-0 w-full h-screen z-0">
        <Scene />
      </div>
      
      <div className="relative z-10">
        <header className="absolute top-0 left-0 w-full p-4 sm:p-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tighter">GlossGen</h1>
          <Link to="/analyze" className="bg-white/10 border border-white/20 backdrop-blur-sm text-white font-bold py-2 px-5 rounded-lg hover:bg-white/20 transition-colors text-sm">
            Get Started
          </Link>
        </header>

        <section className="min-h-screen flex items-center justify-center text-center p-4">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8, delay: 0.2 }}>
            <h2 className="text-5xl md:text-7xl font-bold tracking-tighter mb-4" style={{textShadow: '0 0 25px rgba(255, 94, 10, 0.3)'}}>
              Unlock Deeper Insights
            </h2>
            <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-8">
              AI-powered analysis for GitHub repositories and developer profiles. Instantly generate code glossaries, evaluate profile health, and understand tech stacks.
            </p>
            <Link to="/analyze" className="bg-accent text-black font-bold py-3 px-8 rounded-lg text-lg shadow-lg shadow-accent/20 hover:bg-orange-400 hover:shadow-xl hover:shadow-accent/40 transition-all duration-300 transform hover:scale-105">
              Start Analyzing
            </Link>
          </motion.div>
        </section>

        <main className="bg-black py-20 sm:py-32">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <motion.div 
              className="text-center"
              initial="offscreen" whileInView="onscreen" viewport={{ once: true, amount: 0.5 }} variants={cardVariants}
            >
              <h3 className="text-accent font-bold tracking-widest uppercase">Features</h3>
              <p className="text-3xl sm:text-4xl font-bold tracking-tight mt-2">What GlossGen Offers</p>
              <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">Go beyond the surface. Our tools provide rich, actionable insights powered by Google's Gemini.</p>
            </motion.div>

            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4', title: 'Deep Repository Analysis', desc: 'Generate a complete, searchable glossary of functions, classes, and variables. Instantly identify the tech stack and understand the architecture.' },
                { icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', title: 'Insightful Profile Review', desc: 'Get a comprehensive profile health score, an AI-generated summary, actionable suggestions, and unlock achievement badges.' },
                { icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-12v4m-2-2h4m2 10.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z', title: 'Powered by Gemini', desc: 'Leveraging Google\'s state-of-the-art AI to provide nuanced, context-aware analysis for code and developer profiles.' }
              ].map(item => (
                <motion.div key={item.title} className="bg-gray-950/40 border border-white/10 p-8 rounded-2xl" initial="offscreen" whileInView="onscreen" viewport={{ once: true, amount: 0.5 }} variants={cardVariants}>
                  <div className="w-12 h-12 bg-accent/10 border border-accent/30 text-accent rounded-lg flex items-center justify-center"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} /></svg></div>
                  <h4 className="font-bold text-xl mt-6">{item.title}</h4>
                  <p className="text-gray-400 mt-2">{item.desc}</p>
                </motion.div>
              ))}
            </div>

            <motion.div className="mt-24 sm:mt-32" initial="offscreen" whileInView="onscreen" viewport={{ once: true, amount: 0.5 }} variants={cardVariants}>
              <div className="text-center mb-12">
                <h3 className="text-3xl sm:text-4xl font-bold tracking-tight">See It In Action</h3>
                <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">Get a sneak peek of the powerful, detailed analysis you'll receive.</p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="bg-gray-950/40 border border-white/10 p-4 rounded-xl shadow-2xl">
                  <div className="w-full h-80 bg-gray-900 rounded-lg p-4 flex flex-col gap-2">
                    <p className="text-gray-500 font-mono text-xs">Profile Analysis for @gaearon</p>
                    <div className="w-full bg-gray-800/50 rounded p-3 flex items-center gap-4"><div className="w-12 h-12 rounded-full bg-accent/30"></div><div className="flex-1 space-y-2"><div className="h-3 w-3/4 rounded bg-gray-700"></div><div className="h-3 w-1/2 rounded bg-gray-700"></div></div></div>
                    <div className="w-full bg-gray-800/50 rounded p-3 space-y-2"><div className="h-2 w-1/3 rounded bg-accent/50 mb-3"></div><div className="h-2 w-full rounded bg-gray-700"></div><div className="h-2 w-5/6 rounded bg-gray-700"></div><div className="h-2 w-full rounded bg-gray-700"></div></div>
                    <div className="w-full bg-gray-800/50 rounded p-3 space-y-2 flex-1"><div className="h-2 w-1/4 rounded bg-accent/50 mb-3"></div><div className="grid grid-cols-3 gap-2"><div className="h-8 rounded bg-gray-700"></div><div className="h-8 rounded bg-gray-700"></div><div className="h-8 rounded bg-gray-700"></div></div></div>
                  </div>
                </div>
                <div className="bg-gray-950/40 border border-white/10 p-4 rounded-xl shadow-2xl">
                  <div className="w-full h-80 bg-gray-900 rounded-lg p-4 flex flex-col gap-2">
                    <p className="text-gray-500 font-mono text-xs">Repo Glossary for facebook/react</p>
                    <div className="w-full bg-gray-800/50 rounded p-3 space-y-2"><div className="h-2 w-1/4 rounded bg-accent/50 mb-3"></div><div className="flex gap-2"><div className="h-4 w-16 rounded bg-gray-700"></div><div className="h-4 w-16 rounded bg-gray-700"></div></div></div>
                    <div className="w-full bg-gray-800/50 rounded p-3 flex-1 flex flex-col gap-2">
                      <div className="h-2 w-1/3 rounded bg-accent/50 mb-2"></div>
                      <div className="h-6 w-full rounded bg-gray-700/50"></div>
                      <div className="h-6 w-full rounded bg-gray-700/50"></div>
                      <div className="h-6 w-full rounded bg-gray-700/50"></div>
                      <div className="h-6 w-full rounded bg-gray-700/50"></div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </main>
      </div>

      <footer className="relative z-10 text-center py-8 border-t border-white/10 text-gray-600 text-xs font-mono">
        <p>&copy; {new Date().getFullYear()} <a href="https://github.com/tanmaygalav" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">Tanmay galav</a>. All Rights Reserved.</p>
      </footer>
    </div>
  );
}

export default HomePage;
