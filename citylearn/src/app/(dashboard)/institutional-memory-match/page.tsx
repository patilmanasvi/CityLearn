// @ts-nocheck
"use client";

import React, { useEffect } from "react";

export default function Page() {

  useEffect(() => {
    const runScript = () => {
      try {
        // Simple Interaction Logic
        document.querySelectorAll('.glass-card').forEach(card => {
            card.addEventListener('mousedown', () => {
                card.style.transform = 'scale(0.98)';
            });
            card.addEventListener('mouseup', () => {
                card.style.transform = 'scale(1)';
            });
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'scale(1)';
            });
        });

        // Pulsing AI status indicator simulation
        const statusDot = document.querySelector('.neural-dot');
        if (statusDot) {
          const interval = setInterval(() => {
              statusDot.style.opacity = Math.random() > 0.5 ? '1' : '0.4';
          }, 800);
          return () => clearInterval(interval);
        }
      } catch (e) {
        console.error("Error running page script:", e);
      }
    };
    runScript();
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
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
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-primary/10 text-primary text-[9px] font-bold tracking-wider rounded uppercase">AI Analytics</span>
              <span className="text-muted-foreground text-[9px] font-bold tracking-wider uppercase font-mono">Match Engine v4.2</span>
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">Historical Match Engine</h1>
            <p className="text-muted-foreground text-sm max-w-2xl">
              Retrieving spatial-temporal patterns from Institutional Memory. Current event: <span className="text-primary font-bold">Downtown Fleet Migration (ID: 99x-A)</span>.
            </p>
          </div>
          
          <div className="flex gap-2">
            <div className="relative group">
              <span className="absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                <span className="material-symbols-outlined text-base">search</span>
              </span>
              <input className="bg-white border border-border rounded-full pl-9 pr-4 py-1.5 text-xs focus:ring-1 focus:ring-primary w-56 transition-all text-foreground placeholder:text-muted-foreground" placeholder="Query historical memory..." type="text"/>
            </div>
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
                <span className="text-primary font-display font-bold text-xl">94.2%</span>
              </div>
              <div className="bg-muted/30 border border-border/50 rounded-xl p-3">
                <span className="block text-[9px] font-bold text-muted-foreground uppercase tracking-wider font-sans">Pattern Drift</span>
                <span className="text-accent font-display font-bold text-xl">±2.4%</span>
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
              <button className="bg-white hover:bg-muted border border-border p-2 rounded-lg transition-colors text-muted-foreground">
                <span className="material-symbols-outlined text-base">filter_list</span>
              </button>
              <button className="bg-white hover:bg-muted border border-border p-2 rounded-lg transition-colors text-muted-foreground">
                <span className="material-symbols-outlined text-base">sort</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Match Card 1 */}
            <div className="bg-white border border-border rounded-xl overflow-hidden flex flex-col group shadow-sm hover:shadow-md transition-all">
              <div className="relative h-40 overflow-hidden bg-muted">
                <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" data-alt="Marathon runners fill city streets" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCnxR0ccKBqqHeNPLE5PRBsr8yAvLT65LvcZ_3oQTaQKzJ3yZYXmkIf5xVhvmXyMWZaAEVDGXTJDmUy9ZgKoXe1s1aWtg6fzOrX_Xp_ZywlyC2EW4-bC9BFLf_MXec6IdwGGkE6ibdUy1l9JMgj4zI0P5IrC7E7Y4P1vWxKtFGdIvQewp1ocw0dhNItpxRlBBdybyB0Sn2HZ4toy_80qXAF3jGSaFp1g9P1FybhMCvDw-HQr9ENkR26NfieWrSGlGCWn4Twjmy6PqI"/>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-4 left-4 text-white">
                  <span className="text-[9px] font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded mb-1.5 inline-block uppercase">Most Similar</span>
                  <h4 className="font-display font-bold text-base leading-tight">City Marathon 2023</h4>
                </div>
              </div>
              
              <div className="p-5 flex-1 flex flex-col">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <span className="block text-[9px] font-bold text-muted-foreground uppercase tracking-wider font-sans">Similarity</span>
                    <span className="font-mono text-primary font-bold text-lg">96.8%</span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-bold text-muted-foreground uppercase tracking-wider font-sans">Outcome</span>
                    <span className="font-mono text-green-600 font-bold text-lg">Success</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50 mb-4 text-xs">
                  <span className="text-muted-foreground flex items-center gap-1 font-semibold">
                    <span className="material-symbols-outlined text-[15px]">timer</span> Resolution Time
                  </span>
                  <span className="font-mono text-foreground font-bold">04:12:44</span>
                </div>
                
                <button className="mt-auto w-full py-2 bg-primary/10 border border-primary/20 text-primary font-bold text-xs rounded-lg hover:bg-primary hover:text-primary-foreground transition-all flex items-center justify-center gap-2">
                  Analyze Archive <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
            </div>

            {/* Match Card 2 */}
            <div className="bg-white border border-border rounded-xl overflow-hidden flex flex-col group shadow-sm hover:shadow-md transition-all">
              <div className="relative h-40 overflow-hidden bg-muted">
                <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" data-alt="Stadium glow lighting" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB49qcoE98LwWbc2IA2N2UN_pZiEdk1n7q7DCSx2oAmTyaREomdfpjxsoplkMqqacN0hE17ikbYY5K4ZU2qI7qwEXUpfZfKw0YhEfLi_VRbDGY0KyGkjQcMvlwlCYadXaI8AftwQNmvoOGkuxwxjxmMY6f3JwUrPafh4Sn3ZDVcxmBe0VGKWZ2A_82Sxnw5Z6c-MmFEWePaMKnx9GWOXeVrqVmxeumUIrSsX2sBbbJBm-kvyA4X3pJvphluq_zgQX_DmjcDjNHf0hI"/>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-4 left-4 text-white">
                  <span className="text-[9px] font-bold bg-destructive text-destructive-foreground px-2 py-0.5 rounded mb-1.5 inline-block uppercase">Critical Match</span>
                  <h4 className="font-display font-bold text-base leading-tight">Stadium Opening Night</h4>
                </div>
              </div>
              
              <div className="p-5 flex-1 flex flex-col">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <span className="block text-[9px] font-bold text-muted-foreground uppercase tracking-wider font-sans">Similarity</span>
                    <span className="font-mono text-primary font-bold text-lg">82.1%</span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-bold text-muted-foreground uppercase tracking-wider font-sans">Outcome</span>
                    <span className="font-mono text-destructive font-bold text-lg">Critical</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50 mb-4 text-xs">
                  <span className="text-muted-foreground flex items-center gap-1 font-semibold">
                    <span className="material-symbols-outlined text-[15px]">timer</span> Resolution Time
                  </span>
                  <span className="font-mono text-foreground font-bold">08:45:12</span>
                </div>
                
                <button className="mt-auto w-full py-2 bg-muted hover:bg-muted-foreground/10 border border-border text-foreground font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-2">
                  View Replay <span className="material-symbols-outlined text-sm">play_circle</span>
                </button>
              </div>
            </div>

            {/* Match Card 3 */}
            <div className="bg-white border border-border rounded-xl overflow-hidden flex flex-col group shadow-sm hover:shadow-md transition-all">
              <div className="relative h-40 overflow-hidden bg-muted">
                <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" data-alt="Transit interchange graph" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBA_qg2ul5JaJVcRBYwQUFQ36kA5-HWIX5UmQfXMPdLB9t_gH3E65PZjdrfdJYwDeOBPSBIwHX2m1Fj1GhrV6YKPgC2BwU6NJ2pIGEycSaDl3wZDCzGruQognaVSFRdnawhVdG-16mMBf4MfG_eCFtcoYh0Wj3F5I6x4cZB8So6dZo71iRcNOwQtv9XeOu0fpk33YtoOVO9npeiRpXpv91HARZf6umCXMlWH4pgRKy-vrgD2pbxD4ohBHN1Xh2CaNdW-NBuplPZ88Y"/>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-4 left-4 text-white">
                  <h4 className="font-display font-bold text-base leading-tight">Fleet System Reboot</h4>
                </div>
              </div>
              
              <div className="p-5 flex-1 flex flex-col">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <span className="block text-[9px] font-bold text-muted-foreground uppercase tracking-wider font-sans">Similarity</span>
                    <span className="font-mono text-primary font-bold text-lg">74.5%</span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-bold text-muted-foreground uppercase tracking-wider font-sans">Outcome</span>
                    <span className="font-mono text-green-600 font-bold text-lg">Success</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50 mb-4 text-xs">
                  <span className="text-muted-foreground flex items-center gap-1 font-semibold">
                    <span className="material-symbols-outlined text-[15px]">timer</span> Resolution Time
                  </span>
                  <span className="font-mono text-foreground font-bold">01:30:00</span>
                </div>
                
                <button className="mt-auto w-full py-2 bg-muted hover:bg-muted-foreground/10 border border-border text-foreground font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-2">
                  Analyze Archive <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>
    </>
  );
}
