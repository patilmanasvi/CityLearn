// @ts-nocheck
"use client";

import React, { useEffect, useState } from "react";
import { CrowdCanvas } from "@/components/shared/CrowdCanvas";
import { Country, State, City } from "country-state-city";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";

export default function Page() {
  const [selectedCountryCode, setSelectedCountryCode] = useState("");
  const [selectedStateCode, setSelectedStateCode] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [countryOpen, setCountryOpen] = useState(false);
  const [stateOpen, setStateOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);

  const [countrySearch, setCountrySearch] = useState("");
  const [stateSearch, setStateSearch] = useState("");
  const [citySearch, setCitySearch] = useState("");

  // Memoized lists from library
  const countries = React.useMemo(() => Country.getAllCountries(), []);

  const selectedCountryObj = React.useMemo(() => {
    return countries.find((c) => c.isoCode === selectedCountryCode);
  }, [selectedCountryCode, countries]);

  const statesList = React.useMemo(() => {
    return selectedCountryCode ? State.getStatesOfCountry(selectedCountryCode) : [];
  }, [selectedCountryCode]);

  const selectedStateObj = React.useMemo(() => {
    return statesList.find((s) => s.isoCode === selectedStateCode);
  }, [selectedStateCode, statesList]);

  const citiesList = React.useMemo(() => {
    if (!selectedCountryCode) return [];
    if (statesList.length === 0) {
      return City.getCitiesOfCountry(selectedCountryCode) || [];
    }
    return selectedStateCode
      ? City.getCitiesOfState(selectedCountryCode, selectedStateCode)
      : [];
  }, [selectedCountryCode, selectedStateCode, statesList]);

  const handleCountryChange = (countryCode: string) => {
    setSelectedCountryCode(countryCode);
    setSelectedStateCode("");
    setSelectedCity("");
    setStateSearch("");
    setCitySearch("");
  };

  const handleStateChange = (stateCode: string) => {
    setSelectedStateCode(stateCode);
    setSelectedCity("");
    setCitySearch("");
  };

  // Search filtering with performance limitation of 100 entries max
  const filteredCountries = React.useMemo(() => {
    if (!countrySearch) return countries.slice(0, 100);
    const lowerSearch = countrySearch.toLowerCase();
    const matches: any[] = [];
    for (const c of countries) {
      if (c.name.toLowerCase().includes(lowerSearch)) {
        matches.push(c);
        if (matches.length >= 100) break;
      }
    }
    return matches;
  }, [countries, countrySearch]);

  const filteredStates = React.useMemo(() => {
    if (!stateSearch) return statesList.slice(0, 100);
    const lowerSearch = stateSearch.toLowerCase();
    const matches: any[] = [];
    for (const s of statesList) {
      if (s.name.toLowerCase().includes(lowerSearch)) {
        matches.push(s);
        if (matches.length >= 100) break;
      }
    }
    return matches;
  }, [statesList, stateSearch]);

  const filteredCities = React.useMemo(() => {
    if (!citySearch) return citiesList.slice(0, 100);
    const lowerSearch = citySearch.toLowerCase();
    const matches: any[] = [];
    for (const city of citiesList) {
      if (city.name.toLowerCase().includes(lowerSearch)) {
        matches.push(city);
        if (matches.length >= 100) break;
      }
    }
    return matches;
  }, [citiesList, citySearch]);

  const isCityDisabled = !selectedCountryCode || (statesList.length > 0 && !selectedStateCode);

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
              // Validate Step 3 fields: Country, State, City
              const countryVal = (document.getElementsByName("country")[0] as HTMLInputElement)?.value;
              const stateVal = (document.getElementsByName("state")[0] as HTMLInputElement)?.value;
              const cityVal = (document.getElementsByName("city")[0] as HTMLInputElement)?.value;

              const stateBtn = document.getElementById("state-trigger-btn") as HTMLButtonElement;
              const isStateRequired = stateBtn && !stateBtn.disabled;

              if (!countryVal) {
                alert("Please select a Country.");
                return;
              }
              if (isStateRequired && !stateVal) {
                alert("Please select a State/Region.");
                return;
              }
              if (!cityVal) {
                alert("Please select a Primary City.");
                return;
              }

              // Validate terms checkbox
              const termsCheckbox = document.getElementById("terms") as HTMLInputElement;
              if (termsCheckbox && !termsCheckbox.checked) {
                alert("Please agree to the Terms of Service and Data Governance Protocol.");
                return;
              }

              const signupForm = document.getElementById("signup-form") as HTMLFormElement | null;
              const formData = signupForm ? new FormData(signupForm) : null;
              const passwordField = document.getElementById("password") as HTMLInputElement | null;
              const confirmPasswordField = document.getElementById("confirm-password") as HTMLInputElement | null;
              const roleField = signupForm?.querySelector('#step-2-content input[type="text"]') as HTMLInputElement | null;
              const departmentField = signupForm?.querySelector('#step-2-content select') as HTMLSelectElement | null;

              const passwordVal = passwordField?.value || "";
              const confirmPasswordVal = confirmPasswordField?.value || "";

              if (passwordVal !== confirmPasswordVal) {
                alert("Passwords do not match.");
                return;
              }

              // Submit logic
              nextBtn.innerHTML = '<span class="material-symbols-outlined animate-spin text-sm mr-1">progress_activity</span> Deploying...';
              nextBtn.disabled = true;

              fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  name: formData?.get("name") || "",
                  email: formData?.get("email") || "",
                  password: passwordVal,
                  department: departmentField?.value || "",
                  role: roleField?.value || "",
                  country: formData?.get("country") || "",
                  state: formData?.get("state") || "",
                  city: formData?.get("city") || "",
                }),
              })
                .then(async (response) => {
                  const data = await response.json();
                  if (!response.ok || !data.success) {
                    alert(data.message || "Registration failed. Please try again.");
                    nextBtn.innerHTML = '<span>Next Step</span><span class="material-symbols-outlined text-base">how_to_reg</span>';
                    nextBtn.disabled = false;
                    return;
                  }
                  alert("Account initialization sequence complete. Redirecting to Dashboard.");
                  window.location.href = "/dashboard";
                })
                .catch(() => {
                  alert("Unable to connect. Please try again.");
                  nextBtn.innerHTML = '<span>Next Step</span><span class="material-symbols-outlined text-base">how_to_reg</span>';
                  nextBtn.disabled = false;
                });
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
  }, [countries]);

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
        /* Suppress browser-default password reveal eye icon */
        input::-ms-reveal,
        input::-ms-clear {
          display: none;
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
                <span className="font-croissant font-bold text-lg text-foreground">CityLearn</span>
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
              
              {/* Hidden Inputs for Country/State/City */}
              <input type="hidden" name="country" value={selectedCountryObj ? selectedCountryObj.name : ""} />
              <input type="hidden" name="state" value={selectedStateObj ? selectedStateObj.name : ""} />
              <input type="hidden" name="city" value={selectedCity} />

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
                    <div className="relative group">
                      <input className="w-full bg-slate-50 border border-border rounded-lg pl-4 pr-12 py-3 text-sm font-sans text-foreground transition-all focus:bg-white focus:border-primary" id="password" placeholder="••••••••" type={showPassword ? "text" : "password"} required />
                      <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary p-1" type="button" onClick={() => setShowPassword(!showPassword)}>
                        <span className="material-symbols-outlined text-base">{showPassword ? "visibility" : "visibility_off"}</span>
                      </button>
                    </div>
                    <div className="password-strength-meter mt-2">
                      <div className="strength-bar" id="strength-bar"></div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Confirm Password</label>
                    <div className="relative group">
                      <input className="w-full bg-slate-50 border border-border rounded-lg pl-4 pr-12 py-3 text-sm font-sans text-foreground transition-all focus:bg-white focus:border-primary" id="confirm-password" placeholder="••••••••" type={showConfirmPassword ? "text" : "password"} required />
                      <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary p-1" type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                        <span className="material-symbols-outlined text-base">{showConfirmPassword ? "visibility" : "visibility_off"}</span>
                      </button>
                    </div>
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
                
                {/* Country Dropdown */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Country</label>
                  <Popover open={countryOpen} onOpenChange={setCountryOpen}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="w-full h-12 bg-slate-50 border border-border rounded-lg px-4 text-sm font-sans text-foreground focus:bg-white focus:border-primary outline-none transition-all flex items-center justify-between text-left"
                      >
                        <span className="truncate flex-grow pr-2">{selectedCountryObj ? selectedCountryObj.name : "Select Country..."}</span>
                        <span className="material-symbols-outlined text-muted-foreground shrink-0 text-base">expand_more</span>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="bg-white border border-border shadow-lg max-h-[280px] overflow-hidden rounded-lg">
                      <Command>
                        <CommandInput 
                          placeholder="Search country..." 
                          value={countrySearch} 
                          onValueChange={setCountrySearch} 
                        />
                        <CommandList>
                          <CommandEmpty>No country found.</CommandEmpty>
                          <CommandGroup>
                            {filteredCountries.map((country) => (
                              <CommandItem
                                key={country.isoCode}
                                value={country.name}
                                onSelect={() => {
                                  handleCountryChange(country.isoCode);
                                  setCountryOpen(false);
                                  setCountrySearch("");
                                }}
                              >
                                {country.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                
                {/* State / Province Dropdown */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">State/Region</label>
                  <Popover open={stateOpen} onOpenChange={setStateOpen}>
                    <PopoverTrigger asChild>
                      <button
                        id="state-trigger-btn"
                        type="button"
                        disabled={!selectedCountryCode}
                        className="w-full h-12 bg-slate-50 border border-border rounded-lg px-4 text-sm font-sans text-foreground focus:bg-white focus:border-primary outline-none transition-all flex items-center justify-between text-left disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-100"
                      >
                        <span className="truncate flex-grow pr-2">{selectedStateObj ? selectedStateObj.name : "Select State..."}</span>
                        <span className="material-symbols-outlined text-muted-foreground shrink-0 text-base">expand_more</span>
                      </button>
                    </PopoverTrigger>
                    {selectedCountryCode && (
                      <PopoverContent className="bg-white border border-border shadow-lg max-h-[280px] overflow-hidden rounded-lg">
                        <Command>
                          <CommandInput 
                            placeholder="Search state..." 
                            value={stateSearch} 
                            onValueChange={setStateSearch} 
                          />
                          <CommandList>
                            <CommandEmpty>No state found.</CommandEmpty>
                            <CommandGroup>
                              {filteredStates.map((state) => (
                                <CommandItem
                                  key={state.isoCode}
                                  value={state.name}
                                  onSelect={() => {
                                    handleStateChange(state.isoCode);
                                    setStateOpen(false);
                                    setStateSearch("");
                                  }}
                                >
                                  {state.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    )}
                  </Popover>
                </div>
                
                {/* City Dropdown */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Primary City</label>
                  <Popover open={cityOpen} onOpenChange={setCityOpen}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        disabled={isCityDisabled}
                        className="w-full h-12 bg-slate-50 border border-border rounded-lg px-4 text-sm font-sans text-foreground focus:bg-white focus:border-primary outline-none transition-all flex items-center justify-between text-left disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-100"
                      >
                        <span className="truncate flex-grow pr-2">{selectedCity || "Select City..."}</span>
                        <span className="material-symbols-outlined text-muted-foreground shrink-0 text-base">expand_more</span>
                      </button>
                    </PopoverTrigger>
                    {!isCityDisabled && (
                      <PopoverContent className="bg-white border border-border shadow-lg max-h-[280px] overflow-hidden rounded-lg">
                        <Command>
                          <CommandInput 
                            placeholder="Search city..." 
                            value={citySearch} 
                            onValueChange={setCitySearch} 
                          />
                          <CommandList>
                            <CommandEmpty>No city found.</CommandEmpty>
                            <CommandGroup>
                              {filteredCities.map((city, idx) => (
                                <CommandItem
                                  key={`${city.name}-${idx}`}
                                  value={city.name}
                                  onSelect={() => {
                                    setSelectedCity(city.name);
                                    setCityOpen(false);
                                    setCitySearch("");
                                  }}
                                >
                                  {city.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    )}
                  </Popover>
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
