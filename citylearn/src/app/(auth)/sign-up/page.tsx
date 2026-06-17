// @ts-nocheck
"use client";

import React, { useEffect } from "react";
import { CrowdCanvas } from "@/components/shared/CrowdCanvas";

export default function Page() {

  useEffect(() => {
    const runScript = () => {
      try {
        let currentStep = 1;
        const totalSteps = 3;

        const nextBtn = document.getElementById("next-btn");
        const prevBtn = document.getElementById("prev-btn");
        const stepTitle = document.getElementById("step-title");
        const stepSubtitle = document.getElementById("step-subtitle");
        const passwordInput = document.getElementById("password");
        const strengthBar = document.getElementById("strength-bar");

        const stepContents = {
          1: document.getElementById("step-1-content"),
          2: document.getElementById("step-2-content"),
          3: document.getElementById("step-3-content"),
        };

        const titles = {
          1: "Personal Identity",
          2: "Professional Context",
          3: "Geospatial Data",
        };

        const subtitles = {
          1: "Step 1: Define your access credentials.",
          2: "Step 2: Help us tailor your mission control dashboard.",
          3: "Step 3: Regional deployment settings.",
        };

        function updateUI() {
          // Hide all content
          Object.values(stepContents).forEach((content) => {
            if (content) {
              content.classList.add("hidden", "opacity-0", "translate-x-10");
            }
          });

          // Show current content
          const activeContent = stepContents[currentStep];
          if (activeContent) {
            activeContent.classList.remove("hidden");
            setTimeout(() => {
              activeContent.classList.remove("opacity-0", "translate-x-10");
            }, 50);
          }

          // Update text
          if (stepTitle) stepTitle.innerText = titles[currentStep];
          if (stepSubtitle) stepSubtitle.innerText = subtitles[currentStep];

          // Update indicators
          for (let i = 1; i <= totalSteps; i++) {
            const dot = document.getElementById(`dot-${i}`);
            if (dot) {
              if (i <= currentStep) {
                dot.className = "h-1 flex-1 bg-primary rounded-full transition-all duration-500";
              } else {
                dot.className = "h-1 flex-1 bg-muted rounded-full transition-all duration-500";
              }
            }
          }

          // Update buttons
          if (currentStep === 1) {
            if (prevBtn) prevBtn.classList.add("invisible");
          } else {
            if (prevBtn) prevBtn.classList.remove("invisible");
          }

          if (currentStep === totalSteps) {
            if (nextBtn) {
              nextBtn.querySelector("span").innerText = "Create Account";
              nextBtn.querySelector(".material-symbols-outlined").innerText = "how_to_reg";
            }
          } else {
            if (nextBtn) {
              nextBtn.querySelector("span").innerText = "Next Step";
              nextBtn.querySelector(".material-symbols-outlined").innerText = "arrow_forward";
            }
          }
        }

        if (nextBtn) {
          nextBtn.addEventListener("click", () => {
            if (currentStep < totalSteps) {
              currentStep++;
              updateUI();
            } else {
              // Submit logic
              nextBtn.innerHTML = '<span class="material-symbols-outlined animate-spin text-sm mr-1">progress_activity</span> Deploying...';
              nextBtn.disabled = true;
              setTimeout(() => {
                alert("Account initialization sequence complete. Redirecting to Dashboard.");
                window.location.href = "/dashboard";
              }, 2000);
            }
          });
        }

        if (prevBtn) {
          prevBtn.addEventListener("click", () => {
            if (currentStep > 1) {
              currentStep--;
              updateUI();
            }
          });
        }

        if (passwordInput && strengthBar) {
          passwordInput.addEventListener("input", (e) => {
            const val = e.target.value;
            let strength = 0;
            if (val.length > 5) strength += 25;
            if (val.match(/[A-Z]/)) strength += 25;
            if (val.match(/[0-9]/)) strength += 25;
            if (val.match(/[^A-Za-z0-9]/)) strength += 25;

            strengthBar.style.width = strength + "%";

            if (strength < 30) strengthBar.style.backgroundColor = "#ef4444"; // red
            else if (strength < 70) strengthBar.style.backgroundColor = "#f59e0b"; // orange/amber
            else strengthBar.style.backgroundColor = "#10b981"; // green/success
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
        input:focus, select:focus {
          outline: none;
          box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.2);
        }
        .step-transition {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .password-strength-meter {
          height: 4px;
          border-radius: 2px;
          background: #e2e8f0;
          overflow: hidden;
        }
        .strength-bar {
          height: 100%;
          width: 0%;
          transition: width 0.3s ease, background-color 0.3s ease;
        }
      ` }} />

      <div className="relative min-h-screen bg-background text-foreground font-sans flex items-center justify-center p-4">
        
        {/* Animated Background */}
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-purple-50/20 via-white to-blue-50/20 pointer-events-none">
          <CrowdCanvas src="/images/peeps/all-peeps.png" rows={15} cols={7} />
        </div>

        {/* Main Registration Shell */}
        <main className="relative z-10 w-full max-w-2xl bg-white border border-border shadow-xl rounded-2xl overflow-hidden flex flex-col md:flex-row">
          
          {/* Left Branding Column (Visible on Desktop) */}
          <div className="hidden md:flex md:w-1/3 bg-purple-50 border-r border-border p-8 flex-col justify-between text-foreground relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)", backgroundSize: "20px 20px" }}></div>
            </div>
            
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>network_intelligence</span>
                <span className="font-display font-bold text-lg text-foreground">CityLearn</span>
              </div>
              <h2 className="font-display text-2xl font-bold leading-tight">Urban Analytics</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Next-generation urban operations and predictive modeling for resilient institutions.
              </p>
            </div>
          </div>

          {/* Right Form Column */}
          <div className="flex-1 p-8 md:p-10">
            
            {/* Multi-step Indicator */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex gap-2 w-full" id="step-indicator">
                <div className="h-1 flex-1 bg-primary rounded-full transition-all duration-500" id="dot-1"></div>
                <div className="h-1 flex-1 bg-muted rounded-full transition-all duration-500" id="dot-2"></div>
                <div className="h-1 flex-1 bg-muted rounded-full transition-all duration-500" id="dot-3"></div>
              </div>
            </div>

            {/* Step Headers */}
            <div className="mb-6">
              <h2 className="font-display text-2xl text-foreground font-bold mb-1" id="step-title">Personal Identity</h2>
              <p className="text-xs text-muted-foreground font-semibold" id="step-subtitle">Step 1: Define your credentials.</p>
            </div>

            <form className="space-y-5" id="signup-form" onSubmit={(e) => e.preventDefault()}>
              
              {/* Step 1: Personal Credentials */}
              <div className="step-transition space-y-4" id="step-1-content">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Full Name</label>
                  <input className="w-full bg-slate-50 border border-border rounded-lg px-4 py-3 text-sm font-sans text-foreground transition-all focus:bg-white focus:border-primary" name="name" placeholder="Alex Morgan" type="text" required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Email Address</label>
                  <input className="w-full bg-slate-50 border border-border rounded-lg px-4 py-3 text-sm font-sans text-foreground transition-all focus:bg-white focus:border-primary" name="email" placeholder="a.morgan@city.gov" type="email" required />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Password</label>
                    <input className="w-full bg-slate-50 border border-border rounded-lg px-4 py-3 text-sm font-sans text-foreground transition-all focus:bg-white focus:border-primary" id="password" placeholder="••••••••" type="password" required />
                    <div className="password-strength-meter mt-2">
                      <div className="strength-bar" id="strength-bar"></div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Confirm Password</label>
                    <input className="w-full bg-slate-50 border border-border rounded-lg px-4 py-3 text-sm font-sans text-foreground transition-all focus:bg-white focus:border-primary" placeholder="••••••••" type="password" required />
                  </div>
                </div>
              </div>

              {/* Step 2: Professional Identity */}
              <div className="step-transition space-y-4 hidden opacity-0 translate-x-10" id="step-2-content">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Department</label>
                  <div className="relative">
                    <select className="w-full bg-slate-50 border border-border rounded-lg px-4 py-3 text-sm font-sans text-foreground transition-all focus:bg-white focus:border-primary appearance-none">
                      <option>Urban Planning</option>
                      <option>Emergency Response</option>
                      <option>Transit Authority</option>
                      <option>Grid Management</option>
                      <option>Data Science</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none text-base">expand_more</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Role / Designation</label>
                  <input className="w-full bg-slate-50 border border-border rounded-lg px-4 py-3 text-sm font-sans text-foreground transition-all focus:bg-white focus:border-primary" placeholder="e.g. Senior Simulation Analyst" type="text" />
                </div>
              </div>

              {/* Step 3: Geo-Spatial Context */}
              <div className="step-transition space-y-4 hidden opacity-0 translate-x-10" id="step-3-content">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Country</label>
                  <div className="relative">
                    <select className="w-full bg-slate-50 border border-border rounded-lg px-4 py-3 text-sm font-sans text-foreground focus:bg-white focus:border-primary outline-none transition-all appearance-none">
                      <option>United States</option>
                      <option>Singapore</option>
                      <option>Germany</option>
                      <option>Japan</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none text-base">expand_more</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">State/Region</label>
                    <div className="relative">
                      <select className="w-full bg-slate-50 border border-border rounded-lg px-4 py-3 text-sm font-sans text-foreground focus:bg-white focus:border-primary outline-none transition-all appearance-none">
                        <option>California</option>
                        <option>Bavaria</option>
                        <option>Tokyo Prefecture</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none text-base">expand_more</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Primary City</label>
                    <div className="relative">
                      <select className="w-full bg-slate-50 border border-border rounded-lg px-4 py-3 text-sm font-sans text-foreground focus:bg-white focus:border-primary outline-none transition-all appearance-none">
                        <option>San Francisco</option>
                        <option>Munich</option>
                        <option>Tokyo</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none text-base">expand_more</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Primary Zone / District</label>
                  <input className="w-full bg-slate-50 border border-border rounded-lg px-4 py-3 text-sm font-sans text-foreground transition-all focus:bg-white focus:border-primary" placeholder="e.g. North Sector 7" type="text" />
                </div>

                <div className="flex items-start gap-3 pt-2">
                  <input className="mt-1 w-4 h-4 rounded border-border text-primary focus:ring-primary/20 accent-primary" id="terms" type="checkbox" required />
                  <label className="text-[10px] text-muted-foreground font-semibold leading-relaxed" htmlFor="terms">
                    I agree to the <a className="text-primary hover:underline" href="#">Terms of Service</a> and <a className="text-primary hover:underline" href="#">Data Governance Protocol</a> of CityLearn Intelligence.
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3 pt-4 border-t border-border/50">
                <button className="w-full py-4 bg-primary text-primary-foreground rounded-lg font-sans font-bold shadow-lg shadow-primary/10 hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2" id="next-btn" type="button">
                  <span>Next Step</span>
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </button>
                <div className="flex items-center justify-between">
                  <button className="invisible py-2 px-3 text-muted-foreground hover:text-foreground font-semibold text-xs flex items-center gap-1 transition-colors" id="prev-btn" type="button">
                    <span className="material-symbols-outlined text-sm">arrow_back</span>
                    Back
                  </button>
                  <a className="text-xs text-muted-foreground font-semibold" href="/sign-in">
                    Already registered? <span className="text-primary font-bold hover:underline">Sign In</span>
                  </a>
                </div>
              </div>
            </form>
          </div>
        </main>
      </div>
    </>
  );
}
