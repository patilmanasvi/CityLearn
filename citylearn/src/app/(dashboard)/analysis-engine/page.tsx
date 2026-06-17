// @ts-nocheck
"use client";

import React, { useEffect } from "react";

export default function Page() {

  useEffect(() => {
    const runScript = () => {
      try {
        const dnaSegments = document.querySelectorAll('.dna-segment');
        
        // Randomize DNA segment widths slightly on a loop to simulate active processing
        const interval = setInterval(() => {
            dnaSegments.forEach(segment => {
                const baseWidth = parseInt(segment.style.width) || 40;
                const jitter = (Math.random() - 0.5) * 10;
                const newWidth = Math.max(10, Math.min(90, baseWidth + jitter));
                segment.style.width = `${newWidth}%`;
            });
        }, 3000);

        // Pulse effect for analysis button
        const runBtn = document.querySelector('.glow-button-primary');
        if (runBtn) {
            runBtn.addEventListener('mousedown', () => {
                runBtn.style.transform = 'scale(0.98)';
            });
            runBtn.addEventListener('mouseup', () => {
                runBtn.style.transform = 'scale(1)';
            });
        }

        return () => clearInterval(interval);
      } catch (e) {
        console.error("Error running page script:", e);
      }
    };
    runScript();
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .dna-segment {
            height: 5px;
            border-radius: 9999px;
            background: linear-gradient(90deg, hsl(263, 70%, 50%), hsl(221, 83%, 53%));
            opacity: 0.8;
            transition: width 1s ease-out;
        }

        .scanning-line {
            position: absolute;
            height: 2px;
            width: 100%;
            background: linear-gradient(90deg, transparent, hsl(263, 70%, 50%), transparent);
            top: 0;
            animation: scan 4s infinite linear;
        }

        @keyframes scan {
            0% { top: 0%; }
            100% { top: 100%; }
        }

        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
            vertical-align: middle;
        }` }} />

      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Page Header */}
        <div className="space-y-1">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">Analyze New Event</h1>
          <p className="text-muted-foreground text-sm max-w-lg">Input urban dynamics to trigger CityLearn’s signature recognition and similarity mapping engine.</p>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column: Event Form */}
          <section className="space-y-6">
            
            {/* Form Card */}
            <form className="bg-white border border-border shadow-sm rounded-2xl p-8 space-y-6 relative overflow-hidden group">
              <div className="scanning-line opacity-10"></div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Event Type</label>
                  <div className="relative">
                    <select className="w-full bg-muted/30 border border-border rounded-lg p-3 text-sm text-foreground focus:border-primary focus:bg-white outline-none transition-all appearance-none">
                      <option>Public Assembly</option>
                      <option>Infrastructure Failure</option>
                      <option>Transit Surge</option>
                      <option>Dynamic Maintenance</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none text-base">expand_more</span>
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Location</label>
                  <div className="relative">
                    <input className="w-full bg-muted/40 border border-border rounded-lg p-3 text-sm text-muted-foreground font-mono cursor-not-allowed" readOnly="" type="text" value="Zone 4"/>
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-base text-muted-foreground opacity-50">lock</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Duration (Est.)</label>
                  <div className="flex gap-2">
                    <input className="w-full bg-muted/30 border border-border rounded-lg p-3 text-sm text-foreground focus:border-primary focus:bg-white outline-none transition-all" type="number" defaultValue="120"/>
                    <span className="flex items-center px-3 text-[10px] font-bold text-muted-foreground bg-muted border border-border rounded-lg uppercase">Min</span>
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Closure Status</label>
                  <div className="flex items-center gap-4 bg-muted/30 border border-border rounded-lg px-3 h-[48px]">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input defaultChecked className="sr-only peer" type="checkbox"/>
                      <div className="w-11 h-6 bg-muted-foreground/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      <span className="ms-3 text-sm font-semibold text-foreground">Full Closure</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-baseline mb-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Attendance Estimate</label>
                  <span className="text-xs font-mono font-bold text-primary">15,000 Nodes</span>
                </div>
                <input className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary" type="range" defaultValue={50}/>
                <div className="flex justify-between font-mono text-[9px] text-muted-foreground uppercase">
                  <span>Low Density</span>
                  <span>Extreme Surge</span>
                </div>
              </div>

              <div className="pt-2">
                <button className="w-full bg-primary text-primary-foreground font-semibold py-4 rounded-xl flex items-center justify-center gap-2 glow-button-primary transition-all relative" type="button">
                  <span>Run Neural Synthesis</span>
                  <span className="material-symbols-outlined text-lg">bolt</span>
                </button>
              </div>
            </form>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white border border-border p-4 rounded-xl flex flex-col items-center justify-center shadow-sm">
                <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Similarity</span>
                <span className="text-primary font-display text-2xl font-bold mt-1">89%</span>
              </div>
              
              <div className="bg-white border border-border p-4 rounded-xl flex flex-col items-center justify-center shadow-sm border-l-4 border-l-accent">
                <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Confidence</span>
                <span className="text-accent font-display text-2xl font-bold mt-1">94%</span>
              </div>
              
              <div className="bg-white border border-border p-4 rounded-xl flex flex-col items-center justify-center shadow-sm">
                <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Latency</span>
                <span className="text-foreground font-display text-2xl font-bold mt-1">12ms</span>
              </div>
            </div>

          </section>

          {/* Right Column: Visualization */}
          <section className="space-y-6">
            
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Signature Recognition</h2>
              <span className="px-2.5 py-0.5 bg-primary/10 border border-primary/20 rounded text-[9px] font-bold text-primary uppercase">Real-time Embedding</span>
            </div>

            {/* Signature Canvas */}
            <div className="bg-white border border-border rounded-xl relative p-8 flex flex-col items-center justify-center overflow-hidden shadow-sm min-h-[350px]">
              
              {/* DNA Display */}
              <div className="relative z-10 w-full max-w-md space-y-6">
                <div className="text-center space-y-1">
                  <h3 className="font-display text-xl font-bold text-foreground">CityLearn Signature</h3>
                  <p className="text-muted-foreground text-xs font-mono">Hash: 0xFD44...88BE</p>
                </div>
                
                {/* DNA segments */}
                <div className="space-y-3.5 py-4">
                  <div className="flex items-center gap-4">
                    <div className="dna-segment" style={{ width: '40%' }}></div>
                    <div className="dna-segment opacity-20" style={{ width: '20%' }}></div>
                    <div className="dna-segment" style={{ width: '30%' }}></div>
                  </div>
                  <div className="flex items-center gap-4 flex-row-reverse">
                    <div className="dna-segment" style={{ width: '60%' }}></div>
                    <div className="dna-segment" style={{ width: '10%' }}></div>
                    <div className="dna-segment opacity-40" style={{ width: '25%' }}></div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="dna-segment" style={{ width: '15%' }}></div>
                    <div className="dna-segment" style={{ width: '45%' }}></div>
                    <div className="dna-segment opacity-60" style={{ width: '35%' }}></div>
                  </div>
                  <div className="flex items-center gap-4 flex-row-reverse">
                    <div className="dna-segment opacity-30" style={{ width: '30%' }}></div>
                    <div className="dna-segment" style={{ width: '50%' }}></div>
                    <div className="dna-segment" style={{ width: '15%' }}></div>
                  </div>
                </div>

                {/* Node Graph Embedding */}
                <div className="bg-muted/40 p-4 rounded-xl border border-border relative">
                  <div className="flex items-center gap-1.5 mb-3">
                    <span className="material-symbols-outlined text-sm text-primary">hub</span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Embedding Projection</span>
                  </div>
                  
                  <div className="grid grid-cols-5 gap-4 h-24 items-center justify-items-center relative">
                    <div className="relative">
                      <div className="w-2.5 h-2.5 rounded-full bg-primary relative z-10"></div>
                      <div className="absolute inset-0 bg-primary/20 blur-sm rounded-full"></div>
                    </div>
                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/35"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-secondary relative z-10"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/35"></div>
                    <div className="w-3 h-3 rounded-full bg-primary relative z-10"></div>
                    <div className="w-1 h-1 rounded-full bg-muted-foreground/20"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-accent relative z-10"></div>
                    <div className="w-1 h-1 rounded-full bg-muted-foreground/20"></div>
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/50"></div>
                    <div className="w-1 h-1 rounded-full bg-muted-foreground/20"></div>
                    
                    {/* SVG connection overlay */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" stroke="currentColor" strokeWidth="0.75" fill="none">
                      <line x1="20%" x2="40%" y1="30%" y2="70%"></line>
                      <line x1="40%" x2="80%" y1="70%" y2="40%"></line>
                      <line x1="80%" x2="50%" y1="40%" y2="20%"></line>
                      <line x1="50%" x2="20%" y1="20%" y2="30%"></line>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Data Summary floating badge */}
              <div className="absolute bottom-4 right-4 z-10">
                <div className="flex items-center gap-2 bg-white/90 border border-border rounded-full px-3 py-1.5 shadow-sm text-[9px] font-bold text-muted-foreground">
                  <span className="uppercase">Cluster</span>
                  <span className="text-primary font-mono">V4-Z4-S9</span>
                </div>
              </div>

            </div>

            {/* Recommendation card */}
            <div className="bg-white border border-border p-5 rounded-2xl flex items-center justify-between border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined" style={{"fontVariationSettings": "'FILL' 1"}}>recommend</span>
                </div>
                <div className="space-y-0.5">
                  <h4 className="font-display font-bold text-sm text-foreground">Primary Recommendation</h4>
                  <p className="text-xs text-muted-foreground">Redirect Transit Line 84 due to high similarity with 'Olympiad Surge 2022'</p>
                </div>
              </div>
              <button className="px-3.5 py-1.5 bg-muted hover:bg-muted-foreground/10 border border-border rounded-lg text-[10px] font-bold tracking-wider uppercase transition-colors">
                View Case
              </button>
            </div>

          </section>

        </div>

      </div>
    </>
  );
}
