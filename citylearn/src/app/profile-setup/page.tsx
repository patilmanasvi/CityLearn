// @ts-nocheck
"use client";

import React, { useEffect } from "react";

export default function Page() {
  useEffect(() => {
    const runScript = () => {
      try {
        // Simulating the "Complete Setup" logic
        const setupBtn = document.getElementById("complete-setup-btn");
        if (setupBtn) {
          setupBtn.addEventListener("click", (e) => {
            e.preventDefault();
            setupBtn.innerHTML = `
              <span class="material-symbols-outlined animate-spin text-sm">refresh</span>
              <span class="font-semibold text-xs tracking-wider uppercase">Synchronizing...</span>
            `;
            
            setTimeout(() => {
              setupBtn.classList.remove("bg-primary", "hover:bg-primary/95");
              setupBtn.classList.add("bg-green-600", "text-white");
              setupBtn.innerHTML = `
                <span class="material-symbols-outlined text-sm">check_circle</span>
                <span class="font-semibold text-xs tracking-wider uppercase">Authorized</span>
              `;
              setTimeout(() => {
                alert("Profile Initialized. Redirecting to City Dashboard.");
                window.location.href = "/dashboard";
              }, 800);
            }, 1500);
          });
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
          vertical-align: middle;
        }
      ` }} />

      <div className="bg-background text-foreground min-h-screen flex flex-col">
        
        {/* Top AppBar */}
        <header className="bg-white border-b border-border text-foreground sticky top-0 z-50 flex justify-between items-center w-full px-6 md:px-8 h-16 shadow-sm">
          <div className="flex items-center gap-4">
            <span className="text-lg font-bold text-primary tracking-tight">CityLearn Intelligence</span>
            <div className="h-5 w-[1px] bg-border hidden md:block"></div>
            <span className="font-mono text-muted-foreground uppercase tracking-widest text-[9px] hidden md:block">
              Profile Provisioning Engine
            </span>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex gap-4 items-center">
              <span className="material-symbols-outlined text-muted-foreground cursor-pointer hover:text-primary transition-colors text-xl">notifications</span>
              <span className="material-symbols-outlined text-primary cursor-pointer text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>account_circle</span>
            </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col lg:flex-row w-full max-w-7xl mx-auto overflow-hidden">
          
          {/* Left: Contextual Visualizer (Atmospheric Info Panel) */}
          <section className="hidden lg:flex lg:w-1/3 p-8 flex-col justify-between border-r border-border bg-slate-50/50">
            <div className="space-y-4">
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider">System Initializing</span>
              <h1 className="text-3xl font-bold text-foreground leading-tight">
                Welcome to the<br />Core Network.
              </h1>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Initialize your operational profile to access city-wide intelligence, simulation engines, and predictive analytics.
              </p>
            </div>

            {/* Status indicators */}
            <div className="bg-white border border-border p-6 rounded-xl space-y-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></div>
                <span className="text-xs font-bold text-foreground font-mono uppercase tracking-wider">Biometric Link: Pending</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div>
                <span className="text-xs font-bold text-muted-foreground font-mono uppercase tracking-wider">Geo-spatial Lock: Unassigned</span>
              </div>
              
              <div className="pt-4 border-t border-border">
                <p className="font-mono text-[9px] text-muted-foreground leading-relaxed">
                  SECURE_HANDSHAKE: 0x8F92...<br />
                  LATENCY: 14ms<br />
                  ENCRYPTION: AES-256-GCM
                </p>
              </div>
            </div>
          </section>

          {/* Right: The Setup Form */}
          <section className="flex-1 overflow-y-auto p-6 md:p-10 bg-white">
            <div className="max-w-2xl mx-auto space-y-10 pb-16">
              
              {/* Section 1: Professional Identity */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 border-b border-border pb-3">
                  <span className="material-symbols-outlined text-primary text-xl">badge</span>
                  <h2 className="text-lg font-bold text-foreground uppercase tracking-wider">Professional Identity</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Full Name</label>
                    <input
                      className="w-full bg-slate-50 border border-border p-3 rounded-lg text-sm text-foreground focus:border-primary focus:bg-white outline-none transition-all"
                      placeholder="e.g. Alex Chen"
                      type="text"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Department</label>
                    <div className="relative">
                      <select className="w-full bg-slate-50 border border-border p-3 rounded-lg text-sm text-foreground focus:border-primary focus:bg-white outline-none transition-all appearance-none">
                        <option>Urban Planning</option>
                        <option>Emergency Response</option>
                        <option>Transit Authority</option>
                        <option>Grid Management</option>
                        <option>Data Science</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none text-base">expand_more</span>
                    </div>
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Designation</label>
                    <input
                      className="w-full bg-slate-50 border border-border p-3 rounded-lg text-sm text-foreground focus:border-primary focus:bg-white outline-none transition-all"
                      placeholder="e.g. Senior Simulation Analyst"
                      type="text"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Geo-Spatial Context */}
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary text-xl">location_on</span>
                    <h2 className="text-lg font-bold text-foreground uppercase tracking-wider">Geo-Spatial Context</h2>
                  </div>
                  <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-primary/20 text-primary hover:bg-primary/5 transition-all text-xs font-bold uppercase tracking-wider">
                    <span className="material-symbols-outlined text-sm">my_location</span>
                    Use Location
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Country</label>
                    <div className="relative">
                      <select className="w-full bg-slate-50 border border-border p-3 rounded-lg text-sm text-foreground focus:border-primary focus:bg-white outline-none transition-all appearance-none">
                        <option>United States</option>
                        <option>Singapore</option>
                        <option>Germany</option>
                        <option>Japan</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none text-base">expand_more</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">State/Region</label>
                    <div className="relative">
                      <select className="w-full bg-slate-50 border border-border p-3 rounded-lg text-sm text-foreground focus:border-primary focus:bg-white outline-none transition-all appearance-none">
                        <option>California</option>
                        <option>Bavaria</option>
                        <option>Tokyo Prefecture</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none text-base">expand_more</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Primary City</label>
                    <div className="relative">
                      <select className="w-full bg-slate-50 border border-border p-3 rounded-lg text-sm text-foreground focus:border-primary focus:bg-white outline-none transition-all appearance-none">
                        <option>San Francisco</option>
                        <option>Munich</option>
                        <option>Tokyo</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none text-base">expand_more</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Primary Zone / District</label>
                  <input
                    className="w-full bg-slate-50 border border-border p-3 rounded-lg text-sm text-foreground focus:border-primary focus:bg-white outline-none transition-all"
                    placeholder="e.g. North Sector 7"
                    type="text"
                  />
                </div>

                {/* Topographic Map Overlay */}
                <div className="w-full h-44 rounded-xl overflow-hidden border border-border relative group">
                  <img
                    className="w-full h-full object-cover opacity-15 grayscale pointer-events-none"
                    alt="Topo Map display"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCL8iHcq4PAzDwEoO1irwxMvjiwfn1uZiEx06-Cxpy9dYlHO--RUBujRVcKNct35qwgib25yeNa6OJmJm_4bldXoZTTqedaK_D-lCUkkiUWTpfQS8tfgCNS6CMoaMge-8wBSoUub7p9FQFrNyPnGQQ2it9TFEO4OxHfnG2W5ZBY2mb6nNm3RyHoK-YSsjfSVNMmhF5FR9_U76P3GQWmFw409Dad8r_QJQFHzVp7T7_JA36iiAzKktJDkwla9xkRDeTfOqb9oIz0nos"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white/90 to-transparent"></div>
                  <div className="absolute bottom-4 left-4">
                    <div className="flex items-center gap-2 text-primary">
                      <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider">Network Lock: Central Grid</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Interface Preferences */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 border-b border-border pb-3">
                  <span className="material-symbols-outlined text-primary text-xl">settings_suggest</span>
                  <h2 className="text-lg font-bold text-foreground uppercase tracking-wider">Mission Control Preferences</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Dashboard Layout Select */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Preferred Dashboard Layout</label>
                    <div className="grid grid-cols-2 gap-4">
                      
                      {/* Active selected card */}
                      <div className="border border-primary bg-primary/5 p-4 rounded-xl cursor-pointer transition-all">
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-1">
                            <div className="w-full h-3.5 bg-primary/30 rounded-sm"></div>
                          </div>
                          <div className="flex gap-1">
                            <div className="w-1/2 h-6 bg-primary/10 rounded-sm"></div>
                            <div className="w-1/2 h-6 bg-primary/10 rounded-sm"></div>
                          </div>
                          <span className="text-[8px] font-bold text-primary text-center tracking-wide uppercase mt-1">Analytics Prime</span>
                        </div>
                      </div>

                      {/* Alternate layout card */}
                      <div className="border border-border hover:border-primary/40 p-4 rounded-xl cursor-pointer transition-all">
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-1">
                            <div className="w-1/3 h-10 bg-slate-200 rounded-sm"></div>
                            <div className="w-2/3 h-10 bg-slate-200 rounded-sm"></div>
                          </div>
                          <span className="text-[8px] font-bold text-muted-foreground text-center tracking-wide uppercase mt-1">Simulator Flow</span>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Notification protocol toggles */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Notification Protocol</label>
                    <div className="space-y-2">
                      
                      <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-border rounded-lg">
                        <span className="text-xs font-semibold text-foreground">Critical System Alerts</span>
                        <div className="w-8 h-4 bg-primary rounded-full relative cursor-pointer">
                          <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full"></div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-border rounded-lg">
                        <span className="text-xs font-semibold text-foreground">Simulation Reports</span>
                        <div className="w-8 h-4 bg-slate-200 rounded-full relative cursor-pointer">
                          <div className="absolute left-0.5 top-0.5 w-3 h-3 bg-white rounded-full"></div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-border rounded-lg">
                        <span className="text-xs font-semibold text-foreground">Anomaly Triggers</span>
                        <div className="w-8 h-4 bg-primary rounded-full relative cursor-pointer">
                          <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full"></div>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              </div>

              {/* Complete Action */}
              <div className="pt-6 flex justify-end">
                <button
                  id="complete-setup-btn"
                  className="w-full md:w-auto px-8 py-3 bg-primary hover:bg-primary/95 text-white font-semibold rounded-xl shadow-sm hover:shadow flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                  <span className="text-xs font-bold tracking-wider uppercase">Complete Setup</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>

            </div>
          </section>

        </main>
      </div>
    </>
  );
}
