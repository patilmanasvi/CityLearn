// @ts-nocheck
"use client";

import React, { useState, useEffect } from "react";

interface SimilarEvent {
  historical_event_id: number;
  similarity_score: number;
  event_type: string;
  zone: string;
  corridor: string;
  requires_road_closure: boolean;
  resolution_time?: number;
  is_peak_hour: boolean;
  day_of_week: number;
  priority: number;
  police_station: string;
  fingerprint_text: string;
}

export default function Page() {
  const [searchQuery, setSearchQuery] = useState("Lalbagh Road");
  const [isLoading, setIsLoading] = useState(false);
  const [similarEvents, setSimilarEvents] = useState<SimilarEvent[]>([]);
  const [masterMatch, setMasterMatch] = useState(94.2);
  const [patternDrift, setPatternDrift] = useState(2.4);

  // Default fallback data for initialization
  const defaultEvents: SimilarEvent[] = [
    {
      historical_event_id: 8892,
      similarity_score: 96.8,
      event_type: "planned",
      zone: "Central",
      corridor: "Lalbagh Road",
      requires_road_closure: true,
      resolution_time: 252.73,
      is_peak_hour: true,
      day_of_week: 6,
      priority: 3,
      police_station: "Wilson Garden",
      fingerprint_text: "Planned event on Lalbagh Road. Requires road closure."
    },
    {
      historical_event_id: 1104,
      similarity_score: 82.1,
      event_type: "unplanned",
      zone: "South",
      corridor: "Lalbagh Road",
      requires_road_closure: false,
      resolution_time: 525.2,
      is_peak_hour: false,
      day_of_week: 4,
      priority: 2,
      police_station: "Wilson Garden",
      fingerprint_text: "Unplanned accident on Lalbagh Road."
    },
    {
      historical_event_id: 4492,
      similarity_score: 74.5,
      event_type: "unplanned",
      zone: "West",
      corridor: "Lalbagh Road",
      requires_road_closure: false,
      resolution_time: 90.0,
      is_peak_hour: false,
      day_of_week: 1,
      priority: 1,
      police_station: "Wilson Garden",
      fingerprint_text: "Unplanned water logging on Lalbagh Road."
    }
  ];

  useEffect(() => {
    setSimilarEvents(defaultEvents);
  }, []);

  const formatResolutionTime = (minutes?: number) => {
    if (!minutes) return "01:30:00";
    const totalSeconds = Math.round(minutes * 60);
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    try {
      // Build a realistic query payload based on the user's search text
      const payload = {
        id: Math.floor(Math.random() * 10000),
        event_type: "unplanned",
        event_cause: "accident",
        latitude: 12.9539,
        longitude: 77.5852,
        start_datetime: new Date().toISOString(),
        corridor: searchQuery,
        police_station: "Wilson Garden",
        zone: "South",
        junction: "Junction",
        priority: "High"
      };

      const response = await fetch(`${baseUrl}/api/similar-events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("Similar events API failed");
      }

      const data = await response.json();
      if (data.similar_events && data.similar_events.length > 0) {
        setSimilarEvents(data.similar_events);
        
        // Update stats
        const scores = data.similar_events.map((e: any) => e.similarity_score);
        const maxScore = Math.max(...scores);
        setMasterMatch(maxScore);
        setPatternDrift(parseFloat((100 - maxScore + Math.random() * 2).toFixed(1)));
      } else {
        alert("No similar events found for query. Showing fallback historical records.");
        setSimilarEvents(defaultEvents);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to query similarity engine. Make sure the backend server is running on " + baseUrl);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
            vertical-align: middle;
        }
        @keyframes pulse-neural {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(1.2); }
        }
        .neural-dot {
            animation: pulse-neural 2s infinite ease-in-out;
        }
        .radar-grid {
            stroke: rgba(100, 116, 139, 0.15);
            stroke-width: 1;
        }
        .radar-area {
            fill: rgba(124, 58, 237, 0.12);
            stroke: hsl(263, 70%, 50%);
            stroke-width: 2;
        }` }} />

      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <h1 className="page-heading text-foreground">Historical Match Engine</h1>
            <p className="text-muted-foreground text-sm max-w-2xl">
              Retrieving spatial-temporal patterns from Institutional Memory.
            </p>
          </div>
          
          <div>
            <form onSubmit={handleSearch} className="relative group">
              <span className="absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                <span className="material-symbols-outlined text-base">search</span>
              </span>
              <input 
                className="bg-white border border-border rounded-full pl-9 pr-12 py-2 text-xs focus:ring-1 focus:ring-primary w-64 transition-all text-foreground placeholder:text-muted-foreground" 
                placeholder="Query historical memory..." 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button 
                type="submit" 
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary text-primary-foreground text-[10px] px-2.5 py-1 rounded-full font-bold hover:brightness-105 active:scale-95 transition-all"
              >
                GO
              </button>
            </form>
          </div>
        </div>

        {/* Top Section Grid */}
        <div className="grid grid-cols-12 gap-8">
          
          {/* Radar Chart Section */}
          <div className="col-span-12 lg:col-span-5 bg-white border border-border rounded-2xl p-6 flex flex-col items-center justify-center min-h-[380px] shadow-sm">
            <h3 className="w-full text-left font-display text-base font-bold text-foreground mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-lg text-primary">hub</span> Similarity Radar
            </h3>
            
            <div className="relative w-full h-60 flex items-center justify-center">
              <svg className="w-full h-full max-w-[240px]" viewBox="0 0 200 200">
                <circle className="radar-grid fill-none" cx="100" cy="100" r="80"></circle>
                <circle className="radar-grid fill-none" cx="100" cy="100" r="60"></circle>
                <circle className="radar-grid fill-none" cx="100" cy="100" r="40"></circle>
                <line className="radar-grid" x1="100" x2="100" y1="20" y2="180"></line>
                <line className="radar-grid" x1="20" x2="180" y1="100" y2="100"></line>
                <polygon className="radar-area" points="100,40 160,100 100,150 50,100"></polygon>
                <text className="fill-muted-foreground text-[8px] font-bold uppercase tracking-wider font-sans" textAnchor="middle" x="100" y="15">Density</text>
                <text className="fill-muted-foreground text-[8px] font-bold uppercase tracking-wider font-sans" textAnchor="start" x="185" y="104">Speed</text>
                <text className="fill-muted-foreground text-[8px] font-bold uppercase tracking-wider font-sans" textAnchor="middle" x="100" y="194">Risk</text>
                <text className="fill-muted-foreground text-[8px] font-bold uppercase tracking-wider font-sans" textAnchor="end" x="15" y="104">Duration</text>
              </svg>
            </div>
            
            <div className="mt-4 grid grid-cols-2 gap-4 w-full">
              <div className="bg-muted/30 border border-border/50 rounded-xl p-3">
                <span className="block text-[9px] font-bold text-muted-foreground uppercase tracking-wider font-sans">Master Match</span>
                <span className="text-primary font-display font-bold text-xl">{masterMatch.toFixed(1)}%</span>
              </div>
              <div className="bg-muted/30 border border-border/50 rounded-xl p-3">
                <span className="block text-[9px] font-bold text-muted-foreground uppercase tracking-wider font-sans">Pattern Drift</span>
                <span className="text-accent font-display font-bold text-xl">±{patternDrift.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* Lessons Learned */}
          <div className="col-span-12 lg:col-span-7 bg-white border border-border rounded-2xl p-6 flex flex-col shadow-sm">
            <h3 className="font-display text-base font-bold text-foreground mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-lg text-primary">psychology</span> Lessons Learned
            </h3>
            
            <div className="space-y-4 flex-1">
              
              {/* Expandable 1 */}
              <details className="group bg-muted/30 rounded-xl overflow-hidden border border-border transition-all" open>
                <summary className="flex items-center justify-between p-4 cursor-pointer list-none select-none">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-green-600 text-lg">check_circle</span>
                    <span className="font-semibold text-sm text-foreground">Protocol: Dynamic Rerouting Alpha</span>
                  </div>
                  <span className="material-symbols-outlined text-muted-foreground group-open:rotate-180 transition-transform">expand_more</span>
                </summary>
                <div className="px-4 pb-4 text-xs text-muted-foreground border-t border-border/50 pt-3 space-y-3">
                  <p>Automated signal timing adjustments in Sector 7 successfully mitigated 85% of predicted bottlenecking during the 2023 Marathon event.</p>
                  <div className="flex gap-2">
                    <span className="bg-green-50 text-green-700 text-[9px] font-bold px-2 py-0.5 rounded uppercase">Retain Strategy</span>
                    <span className="bg-white text-muted-foreground border border-border text-[9px] font-bold px-2 py-0.5 rounded uppercase">High Confidence</span>
                  </div>
                </div>
              </details>

              {/* Expandable 2 */}
              <details className="group bg-muted/30 rounded-xl overflow-hidden border border-border transition-all">
                <summary className="flex items-center justify-between p-4 cursor-pointer list-none select-none">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-destructive text-lg">cancel</span>
                    <span className="font-semibold text-sm text-foreground">Protocol: Static Perimeter Lock</span>
                  </div>
                  <span className="material-symbols-outlined text-muted-foreground group-open:rotate-180 transition-transform">expand_more</span>
                </summary>
                <div className="px-4 pb-4 text-xs text-muted-foreground border-t border-border/50 pt-3 space-y-3">
                  <p>The 'Stadium Opening' event proved that hard perimeters lead to secondary congestion points. Neural drift suggests adaptive zones instead.</p>
                  <div className="flex gap-2">
                    <span className="bg-red-50 text-destructive text-[9px] font-bold px-2 py-0.5 rounded uppercase">Deprecate</span>
                    <span className="bg-white text-muted-foreground border border-border text-[9px] font-bold px-2 py-0.5 rounded uppercase">Root Cause Identified</span>
                  </div>
                </div>
              </details>

              {/* Expandable 3 */}
              <details className="group bg-muted/30 rounded-xl overflow-hidden border border-border transition-all">
                <summary className="flex items-center justify-between p-4 cursor-pointer list-none select-none">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-secondary text-lg">info</span>
                    <span className="font-semibold text-sm text-foreground">Citizen Messaging Latency</span>
                  </div>
                  <span className="material-symbols-outlined text-muted-foreground group-open:rotate-180 transition-transform">expand_more</span>
                </summary>
                <div className="px-4 pb-4 text-xs text-muted-foreground border-t border-border/50 pt-3 space-y-3">
                  <p>Manual notification approval delays response time. Recommend switching to AI-driven situational broadcasts.</p>
                  <div className="flex gap-2">
                    <span className="bg-blue-50 text-secondary text-[9px] font-bold px-2 py-0.5 rounded uppercase">Iterate</span>
                    <span className="bg-white text-muted-foreground border border-border text-[9px] font-bold px-2 py-0.5 rounded uppercase">Automation Potential</span>
                  </div>
                </div>
              </details>

            </div>
          </div>

        </div>

        {/* Historical Matches */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <h3 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">history</span> Top Historical Matches
            </h3>
            <div className="flex gap-2">
              <button 
                onClick={() => alert("Matches filter parameters: [Min Similarity: 70%, Region: Bangalore]")} 
                className="bg-white hover:bg-muted border border-border p-2 rounded-lg transition-colors text-muted-foreground"
              >
                <span className="material-symbols-outlined text-base">filter_list</span>
              </button>
              <button 
                onClick={() => setSimilarEvents([...similarEvents].reverse())} 
                className="bg-white hover:bg-muted border border-border p-2 rounded-lg transition-colors text-muted-foreground"
              >
                <span className="material-symbols-outlined text-base">sort</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading && (
              <div className="col-span-3 text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
                <p className="text-sm font-mono text-muted-foreground">Searching FAISS / TF-IDF incident database index...</p>
              </div>
            )}

            {!isLoading && similarEvents.map((event, index) => {
              // Alternate images
              const imageUrls = [
                "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=400",
                "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?q=80&w=400",
                "https://images.unsplash.com/photo-1492660818633-9ac643d434a2?q=80&w=400"
              ];
              const imgUrl = imageUrls[index % imageUrls.length];

              return (
                <div key={index} className="bg-white border border-border rounded-xl overflow-hidden flex flex-col group shadow-sm hover:shadow-md transition-all">
                  <div className="relative h-40 overflow-hidden bg-muted">
                    <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Historical matching event image" src={imgUrl}/>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div className="absolute bottom-4 left-4 text-white">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded mb-1.5 inline-block uppercase ${
                        index === 0 ? "bg-primary text-primary-foreground" : "bg-slate-700 text-white"
                      }`}>
                        {index === 0 ? "Most Similar" : `Match #${index + 1}`}
                      </span>
                      <h4 className="font-display font-bold text-base leading-tight">
                        {event.corridor} Event #{event.historical_event_id}
                      </h4>
                    </div>
                  </div>
                  
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <span className="block text-[9px] font-bold text-muted-foreground uppercase tracking-wider font-sans">Similarity</span>
                        <span className="font-mono text-primary font-bold text-lg">{event.similarity_score.toFixed(1)}%</span>
                      </div>
                      <div>
                        <span className="block text-[9px] font-bold text-muted-foreground uppercase tracking-wider font-sans">Outcome</span>
                        <span className={`font-mono font-bold text-lg ${
                          event.requires_road_closure ? "text-destructive" : "text-green-600"
                        }`}>
                          {event.requires_road_closure ? "Closure Req" : "Resolved"}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50 mb-4 text-xs">
                      <span className="text-muted-foreground flex items-center gap-1 font-semibold">
                        <span className="material-symbols-outlined text-[15px]">timer</span> Resolution Time
                      </span>
                      <span className="font-mono text-foreground font-bold">
                        {formatResolutionTime(event.resolution_time)}
                      </span>
                    </div>
                    
                    <button 
                      onClick={() => alert(`Causal Pattern Fingerprint:\n${event.fingerprint_text || "Details not specified."}`)}
                      className="mt-auto w-full py-2 bg-primary/10 border border-primary/20 text-primary font-bold text-xs rounded-lg hover:bg-primary hover:text-primary-foreground transition-all flex items-center justify-center gap-2"
                    >
                      Analyze Archive <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </>
  );
}
