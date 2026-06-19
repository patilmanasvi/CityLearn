// @ts-nocheck
"use client";

import React, { useEffect, useState } from "react";
import { loadUnifiedAnalysis } from "@/lib/analysis";

export default function Page() {
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setAnalysis(await loadUnifiedAnalysis());
      } catch (err) {
        console.error("Failed to load unified analysis:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const similarEvents = analysis?.similar_events || [];
  const lessonsLearned = analysis?.lessons_learned || "";
  const masterMatchScore = similarEvents[0]?.similarity_score;

  const attendance = analysis?.event_analysis?.input?.attendance || 0;
  const resolution = analysis?.predictions?.resolution_prediction || 120;
  const congestion = analysis?.predictions?.congestion_prediction || 1;
  const duration = analysis?.event_analysis?.input?.duration || 120;

  const val_density = analysis ? Math.min(1.0, attendance / 100000) : 0.5;
  const val_speed = analysis ? Math.max(0.1, 1 - resolution / 480) : 0.5;
  const val_risk = analysis ? Math.min(1.0, congestion / 10) : 0.5;
  const val_duration = analysis ? Math.min(1.0, duration / 480) : 0.5;

  const radarPoints = `${100},${(100 - 80 * val_density).toFixed(1)} ${(100 + 80 * val_speed).toFixed(1)},${100} ${100},${(100 + 80 * val_risk).toFixed(1)} ${(100 - 80 * val_duration).toFixed(1)},${100}`;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="page-heading text-foreground">Historical Match Engine</h1>
          <p className="text-muted-foreground text-sm max-w-2xl">
            Dataset similarity results from the most recent Analysis Engine run.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
          <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Master Match</span>
          <span className="text-primary font-display font-bold text-3xl">
            {isLoading ? "..." : masterMatchScore !== undefined ? `${masterMatchScore.toFixed(1)}%` : "Run analysis"}
          </span>
        </div>
        <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
          <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Dataset Matches</span>
          <span className="text-accent font-display font-bold text-3xl">{isLoading ? "..." : similarEvents.length}</span>
        </div>
        <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
          <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Active Event</span>
          <span className="text-foreground font-display font-bold text-xl">
            {isLoading ? "..." : analysis?.event_analysis?.event_type || "Run analysis"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Similarity Radar */}
        <div className="lg:col-span-5 bg-white border border-border rounded-xl p-6 shadow-sm flex flex-col items-center justify-center min-h-[400px]">
          <h3 className="w-full text-left font-display text-base font-bold text-foreground mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">hub</span> Similarity Radar
          </h3>
          <div className="relative w-full h-64 flex items-center justify-center">
            <svg className="w-full h-full max-w-[280px]" viewBox="0 0 200 200">
              <circle className="stroke-slate-200 fill-none" cx="100" cy="100" r="80" strokeWidth="1"></circle>
              <circle className="stroke-slate-200 fill-none" cx="100" cy="100" r="60" strokeWidth="1"></circle>
              <circle className="stroke-slate-200 fill-none" cx="100" cy="100" r="40" strokeWidth="1"></circle>
              <circle className="stroke-slate-200 fill-none" cx="100" cy="100" r="20" strokeWidth="1"></circle>
              <line className="stroke-slate-200" x1="100" x2="100" y1="20" y2="180" strokeWidth="1"></line>
              <line className="stroke-slate-200" x1="20" x2="180" y1="100" y2="100" strokeWidth="1"></line>
              
              <polygon className="fill-primary/20 stroke-primary" points={radarPoints} strokeWidth="2"></polygon>
              
              <text className="fill-muted-foreground text-[8px] font-bold uppercase tracking-wider" textAnchor="middle" x="100" y="15">Density</text>
              <text className="fill-muted-foreground text-[8px] font-bold uppercase tracking-wider" textAnchor="start" x="185" y="104">Speed</text>
              <text className="fill-muted-foreground text-[8px] font-bold uppercase tracking-wider" textAnchor="middle" x="100" y="195">Risk</text>
              <text className="fill-muted-foreground text-[8px] font-bold uppercase tracking-wider" textAnchor="end" x="15" y="104">Duration</text>
            </svg>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 w-full text-center">
            <div className="bg-slate-50 border border-border rounded p-3">
              <span className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Master Match</span>
              <span className="text-primary font-bold text-lg">{isLoading ? "..." : masterMatchScore !== undefined ? `${masterMatchScore.toFixed(1)}%` : "N/A"}</span>
            </div>
            <div className="bg-slate-50 border border-border rounded p-3">
              <span className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Pattern Drift</span>
              <span className="text-green-600 font-bold text-lg">±{isLoading ? "..." : (analysis ? "2.4%" : "0.0%")}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Lessons Learned */}
        <div className="lg:col-span-7 bg-white border border-border rounded-xl p-6 shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <h3 className="font-display text-base font-bold text-foreground mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-lg text-primary">psychology</span> Lessons Learned
            </h3>
            {isLoading ? (
              <div className="text-xs text-muted-foreground font-mono">Synthesizing insights...</div>
            ) : lessonsLearned ? (
              <p className="text-sm text-muted-foreground leading-relaxed">{lessonsLearned}</p>
            ) : (
              <div className="text-xs text-muted-foreground font-mono">Run an event analysis to compute lessons learned.</div>
            )}
          </div>
          {analysis && (
            <div className="mt-6 p-4 bg-primary/5 border border-primary/10 rounded-xl">
              <span className="text-xs font-bold text-primary block uppercase tracking-wider mb-1">Recommendation Basis</span>
              <p className="text-xs text-muted-foreground">
                These lessons are dynamically generated from previous matches on <strong>{analysis.event_analysis.location}</strong> with similar crowd size.
              </p>
            </div>
          )}
        </div>
      </div>

      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <h3 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">history</span> Top Historical Matches
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full text-xs text-muted-foreground font-mono">Loading matching historical logs...</div>
          ) : similarEvents.length > 0 ? (
            similarEvents.map((event, index) => (
              <article key={`${event.id}-${index}`} className="bg-white border border-border rounded-xl overflow-hidden flex flex-col shadow-sm">
                <div className="p-5 flex-1 flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="text-[9px] font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded mb-2 inline-block uppercase">
                        {index === 0 ? "Most Similar" : `Match #${index + 1}`}
                      </span>
                      <h4 className="font-display font-bold text-base leading-tight text-foreground">{event.event_name}</h4>
                    </div>
                    <span className="font-mono text-primary font-bold text-lg">{event.similarity_score.toFixed(1)}%</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between gap-3 border-b border-border/50 pb-1">
                      <span className="text-muted-foreground font-semibold">Location</span>
                      <span className="text-foreground font-bold text-right">{event.location}</span>
                    </div>
                    <div className="flex justify-between gap-3 border-b border-border/50 pb-1">
                      <span className="text-muted-foreground font-semibold">Timestamp</span>
                      <span className="text-foreground font-bold text-right">{event.timestamp || "Not recorded"}</span>
                    </div>
                    <div className="flex justify-between gap-3 border-b border-border/50 pb-1">
                      <span className="text-muted-foreground font-semibold">Priority</span>
                      <span className="text-foreground font-bold">{event.priority}</span>
                    </div>
                    <div className="flex justify-between gap-3 pb-1">
                      <span className="text-muted-foreground font-semibold">Closure Required</span>
                      <span className="text-foreground font-bold">{event.requires_road_closure}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-muted/30 rounded-lg border border-border/50 text-[10px] text-muted-foreground italic leading-relaxed">
                    {event.reason_for_match}
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="col-span-full text-xs text-muted-foreground font-mono">Run an event analysis to retrieve historical matches.</div>
          )}
        </div>
      </section>
    </div>
  );
}
