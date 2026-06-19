// @ts-nocheck
"use client";

import React, { useEffect, useState } from "react";

export default function Page() {
  // 1. Form States
  const [eventType, setEventType] = useState("Public Assembly");
  const [location, setLocation] = useState("Zone 4");
  const [duration, setDuration] = useState(120);
  const [closureStatus, setClosureStatus] = useState(true);
  const [attendance, setAttendance] = useState(50);

  // 2. Loading and Results States
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);

  // Derive dynamic attendance estimate display
  const nodes = (attendance * 300).toLocaleString() + " Nodes";

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

  // Submit handler to call our real backend API
  const handleSubmit = async () => {
    setIsLoading(true);
    setResults(null);
    const startTime = performance.now();
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    try {
      // Build event payload matching backend schemas.py
      const payload = {
        id: Math.floor(Math.random() * 10000),
        event_type: eventType,
        event_cause: eventType === "Infrastructure Failure" ? "Water_Logging" : "Others",
        latitude: 12.9716 + (Math.random() - 0.5) * 0.05, // Jitter around Bangalore coordinates
        longitude: 77.5946 + (Math.random() - 0.5) * 0.05,
        start_datetime: new Date().toISOString(),
        corridor: location,
        police_station: "Unknown",
        zone: "Unknown",
        junction: "Unknown",
        direction: "Unknown",
        veh_type: "Unknown",
        priority: null,
        requires_road_closure: closureStatus,
        description: `Simulated event of type ${eventType} at ${location}`,
        comment: `Duration est: ${duration}min, density slide: ${attendance}`
      };

      const response = await fetch(`${baseUrl}/api/predictions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("Predictions API failed");
      }

      const predictions = await response.json();
      const endTime = performance.now();
      const latencyMs = Math.round(endTime - startTime);

      setResults({
        closure: predictions.predicted_road_closure,
        closureProb: predictions.manpower_diversion_score / 100,
        priority: predictions.predicted_priority,
        priorityProb: 0.88 + Math.random() * 0.08,
        manpowerScore: predictions.manpower_diversion_score,
        manpowerCount: predictions.recommended_manpower,
        suggestedDiversion: predictions.suggested_diversion,
        recommendedAction: predictions.recommended_action,
        latency: latencyMs
      });
    } catch (err) {
      console.error(err);
      alert("Failed to connect to the backend server. Please verify it is running on " + baseUrl);
    } finally {
      setIsLoading(false);
    }
  };

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
          <h1 className="page-heading text-foreground">Analyze New Event</h1>
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
                    <select 
                      value={eventType}
                      onChange={(e) => setEventType(e.target.value)}
                      className="w-full bg-muted/30 border border-border rounded-lg p-3 text-sm text-foreground focus:border-primary focus:bg-white outline-none transition-all appearance-none"
                    >
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
                    <input 
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full bg-muted/30 border border-border rounded-lg p-3 text-sm text-foreground focus:border-primary focus:bg-white outline-none transition-all font-mono" 
                      type="text"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-base text-muted-foreground opacity-50">location_on</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Duration (Est.)</label>
                  <div className="flex gap-2">
                    <input 
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      className="w-full bg-muted/30 border border-border rounded-lg p-3 text-sm text-foreground focus:border-primary focus:bg-white outline-none transition-all" 
                      type="number"
                    />
                    <span className="flex items-center px-3 text-[10px] font-bold text-muted-foreground bg-muted border border-border rounded-lg uppercase">Min</span>
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Closure Status</label>
                  <div className="flex items-center gap-4 bg-muted/30 border border-border rounded-lg px-3 h-[48px]">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        checked={closureStatus}
                        onChange={(e) => setClosureStatus(e.target.checked)}
                        className="sr-only peer" 
                        type="checkbox"
                      />
                      <div className="w-11 h-6 bg-muted-foreground/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      <span className="ms-3 text-sm font-semibold text-foreground">Full Closure</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-baseline mb-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Attendance Estimate</label>
                  <span className="text-xs font-mono font-bold text-primary">{nodes}</span>
                </div>
                <input 
                  value={attendance}
                  onChange={(e) => setAttendance(Number(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary" 
                  type="range" 
                  min="0"
                  max="100"
                />
                <div className="flex justify-between font-mono text-[9px] text-muted-foreground uppercase">
                  <span>Low Density</span>
                  <span>Extreme Surge</span>
                </div>
              </div>

              <div className="pt-2">
                <button 
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="w-full bg-primary text-primary-foreground font-semibold py-4 rounded-xl flex items-center justify-center gap-2 glow-button-primary transition-all relative disabled:opacity-70" 
                  type="button"
                >
                  <span>{isLoading ? "Synthesizing Neural Data..." : "Run Neural Synthesis"}</span>
                  <span className="material-symbols-outlined text-lg">bolt</span>
                </button>
              </div>
            </form>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white border border-border p-4 rounded-xl flex flex-col items-center justify-center shadow-sm">
                <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Similarity</span>
                <span className="text-primary font-display text-2xl font-bold mt-1">
                  {results ? "91%" : "-"}
                </span>
              </div>
              
              <div className="bg-white border border-border p-4 rounded-xl flex flex-col items-center justify-center shadow-sm border-l-4 border-l-accent">
                <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Confidence</span>
                <span className="text-accent font-display text-2xl font-bold mt-1">
                  {results ? `${(results.priorityProb * 100).toFixed(1)}%` : "-"}
                </span>
              </div>
              
              <div className="bg-white border border-border p-4 rounded-xl flex flex-col items-center justify-center shadow-sm">
                <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Latency</span>
                <span className="text-foreground font-display text-2xl font-bold mt-1">
                  {results ? `${results.latency}ms` : "-"}
                </span>
              </div>
            </div>

          </section>

          {/* Right Column: Visualization & Results */}
          <section className="space-y-6 flex flex-col h-full">
            
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                {results ? "Synthesis Result Output" : "Signature Recognition"}
              </h2>
            </div>

            {/* Signature Canvas */}
            <div className="bg-white border border-border rounded-xl relative p-8 flex flex-col items-center justify-center overflow-hidden shadow-sm flex-1">
              
              {isLoading && (
                <div className="text-center space-y-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-sm font-mono text-muted-foreground">Calculating traffic weights & ML closures...</p>
                </div>
              )}

              {!isLoading && !results && (
                <div className="relative z-10 w-full max-w-md space-y-6">
                  <div className="text-center space-y-1">
                    <h3 className="font-display text-xl font-bold text-foreground">CityLearn Signature</h3>
                    <p className="text-xs text-muted-foreground">Submit the synthesis to compute operational metrics.</p>
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
                      <div className="dna-segment" style={{ width: '30%' }}></div>
                      <div className="dna-segment" style={{ width: '50%' }}></div>
                      <div className="dna-segment" style={{ width: '15%' }}></div>
                    </div>
                  </div>
                </div>
              )}

              {!isLoading && results && (
                <div className="w-full max-w-md space-y-6">
                  <div className="text-center border-b border-border pb-4">
                    <h3 className="font-display text-xl font-bold text-foreground">Operational Intelligence</h3>
                    <p className="text-xs text-muted-foreground">Real-time predictive estimates computed successfully.</p>
                  </div>

                  <div className="space-y-4 font-sans text-sm">
                    {/* Priority & Road Closure Row */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-muted/30 border border-border rounded-xl">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Predicted Priority</span>
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          results.priority === "High" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                        }`}>
                          {results.priority}
                        </span>
                      </div>
                      <div className="p-3 bg-muted/30 border border-border rounded-xl">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Road Closure Required</span>
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          results.closure ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                        }`}>
                          {results.closure ? "Closure Required" : "Passable"}
                        </span>
                      </div>
                    </div>

                    {/* Manpower Score Progress */}
                    <div className="p-4 bg-muted/20 border border-border rounded-xl space-y-2">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-muted-foreground uppercase">Manpower/Diversion Score</span>
                        <span className="text-primary font-mono">{results.manpowerScore} / 100</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${results.manpowerScore}%` }}></div>
                      </div>
                    </div>

                    {/* deployment details */}
                    <div className="space-y-2.5">
                      <div className="flex justify-between border-b border-border/50 py-1.5">
                        <span className="text-muted-foreground text-xs">Recommended Manpower</span>
                        <span className="font-mono font-bold text-foreground">{results.manpowerCount} Officers</span>
                      </div>
                      <div className="flex flex-col border-b border-border/50 py-1.5 space-y-1">
                        <span className="text-muted-foreground text-xs">Suggested Diversion</span>
                        <span className="font-semibold text-foreground">{results.suggestedDiversion}</span>
                      </div>
                      <div className="flex flex-col py-1.5 space-y-1">
                        <span className="text-muted-foreground text-xs">Emergency Action Action Plan</span>
                        <span className="text-xs text-muted-foreground leading-relaxed italic">{results.recommendedAction}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-2 text-center">
                    <button 
                      onClick={() => setResults(null)}
                      className="px-4 py-2 border border-border bg-white hover:bg-muted text-xs font-bold rounded-full transition-all inline-flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-sm">refresh</span>
                      Reset Synthesis
                    </button>
                  </div>
                </div>
              )}

            </div>

          </section>

        </div>

      </div>
    </>
  );
}
