// @ts-nocheck
"use client";

import React, { useEffect, useState } from "react";
import { Country, State, City } from "country-state-city";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { getApiBaseUrl, storeAnalysis } from "@/lib/analysis";

export default function Page() {
  // 1. Form States
  const [eventType, setEventType] = useState("Public Assembly");

  const [selectedCountryCode, setSelectedCountryCode] = useState("IN");
  const [selectedStateCode, setSelectedStateCode] = useState("KA");
  const [selectedCity, setSelectedCity] = useState("");

  const [countryOpen, setCountryOpen] = useState(false);
  const [stateOpen, setStateOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);

  const [countrySearch, setCountrySearch] = useState("");
  const [stateSearch, setStateSearch] = useState("");
  const [citySearch, setCitySearch] = useState("");

  // Memoized lists from country-state-city
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

  const location = React.useMemo(() => {
    const parts = [
      selectedCity,
      selectedStateObj ? selectedStateObj.name : "",
      selectedCountryObj ? selectedCountryObj.name : ""
    ].filter(p => p && p.trim() !== "");
    return parts.join(", ");
  }, [selectedCity, selectedStateObj, selectedCountryObj]);

  const [duration, setDuration] = useState<number | "">(120);
  const [closureStatus, setClosureStatus] = useState("Full Closure");
  const [attendance, setAttendance] = useState(3); // Default representing 50,000 people

  // Helper functions for continuous attendance mapping
  const getAttendanceCount = (val: number) => {
    const mapping = [0, 1000, 10000, 50000, 100000, 100000];
    const i = Math.floor(val);
    if (i >= 4) {
      return 100000;
    }
    const t = val - i;
    const start = mapping[i];
    const end = mapping[i + 1];
    const raw = start + t * (end - start);
    
    if (i === 0) {
      return Math.round(raw / 50) * 50;
    } else if (i === 1) {
      return Math.round(raw / 100) * 100;
    } else if (i === 2) {
      return Math.round(raw / 500) * 500;
    } else {
      return Math.round(raw / 1000) * 1000;
    }
  };

  const getAttendanceDisplay = (val: number) => {
    if (val >= 4) {
      return "100,000+ people";
    }
    const count = getAttendanceCount(val);
    return `${count.toLocaleString()} people`;
  };

  // 2. Loading and Results States
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);

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
    const baseUrl = getApiBaseUrl();

    try {
      const requiresClosure = closureStatus === "Full Closure" || closureStatus === "Partial Closure";
      const attendanceCount = getAttendanceCount(attendance);

      const city = selectedCity || "Unknown";
      const state = selectedStateObj ? selectedStateObj.name : "Unknown";
      const country = selectedCountryObj ? selectedCountryObj.name : "Unknown";

      // Resolve coordinates dynamically from country-state-city objects
      let finalLat = 12.9716;
      let finalLon = 77.5946;

      const selectedCityObj = citiesList.find((c) => c.name === selectedCity);
      if (selectedCityObj && selectedCityObj.latitude && selectedCityObj.longitude) {
        finalLat = parseFloat(selectedCityObj.latitude);
        finalLon = parseFloat(selectedCityObj.longitude);
      } else if (selectedStateObj && selectedStateObj.latitude && selectedStateObj.longitude) {
        finalLat = parseFloat(selectedStateObj.latitude);
        finalLon = parseFloat(selectedStateObj.longitude);
      } else if (selectedCountryObj && selectedCountryObj.latitude && selectedCountryObj.longitude) {
        finalLat = parseFloat(selectedCountryObj.latitude);
        finalLon = parseFloat(selectedCountryObj.longitude);
      }

      // Build event payload matching backend schemas.py
      const payload = {
        event_type: eventType,
        event_cause: eventType === "Infrastructure Failure" ? "Water_Logging" : "Others",
        latitude: finalLat,
        longitude: finalLon,
        attendance: attendanceCount,
        duration: Number(duration) || 0,
        closure_status: closureStatus,
        start_datetime: new Date().toISOString(),
        corridor: location,
        police_station: "Unknown",
        zone: state,
        city: city,
        state: state,
        country: country,
        junction: "Unknown",
        direction: "Unknown",
        veh_type: "Unknown",
        priority: null,
        requires_road_closure: requiresClosure,
        description: `Simulated event of type ${eventType} at ${location}`,
        comment: `Duration est: ${Number(duration) || 0}min, closure status: ${closureStatus}, attendance estimate: ${attendanceCount}`
      };

      const analysisResponse = await fetch(`${baseUrl}/analyze-event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(res => {
        if (!res.ok) throw new Error("Analyze Event API failed");
        return res.json();
      });

      const predictions = await response.json();
      const endTime = performance.now();
      const latencyMs = Math.round(endTime - startTime);

      const predictions = analysisResponse.predictions;
      const recommendations = analysisResponse.recommendations;
      const topSimilarity = analysisResponse.similar_events?.[0]?.similarity_score || 0;

      localStorage.setItem("last_analyzed_event", JSON.stringify(payload));
      storeAnalysis(analysisResponse);

      setResults({
        closure: predictions.road_closure_required,
        closureProb: predictions.road_closure_probability,
        priority: predictions.priority,
        priorityProb: predictions.priority_probability,
        manpowerScore: predictions.congestion_prediction * 10,
        manpowerCount: recommendations.officer_deployment.officer_count,
        similarityScore: topSimilarity,
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
              
              {/* Row 1: Event Type | Country */}
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
                
                {/* Country Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Country</label>
                  <button
                    type="button"
                    disabled
                    className="w-full bg-muted/20 border border-border rounded-lg p-3 text-sm text-foreground outline-none transition-all flex items-center justify-between text-left h-[48px] opacity-75 cursor-not-allowed"
                  >
                    <span className="truncate flex-grow pr-2">India</span>
                    <span className="material-symbols-outlined text-muted-foreground shrink-0 text-base">lock</span>
                  </button>
                </div>
              </div>

              {/* Row 2: State | City */}
              <div className="grid grid-cols-2 gap-4">
                {/* State Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">State/Region</label>
                  <button
                    type="button"
                    disabled
                    className="w-full bg-muted/20 border border-border rounded-lg p-3 text-sm text-foreground outline-none transition-all flex items-center justify-between text-left h-[48px] opacity-75 cursor-not-allowed"
                  >
                    <span className="truncate flex-grow pr-2">Karnataka</span>
                    <span className="material-symbols-outlined text-muted-foreground shrink-0 text-base">lock</span>
                  </button>
                </div>

                {/* City Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">City</label>
                  <Popover open={cityOpen} onOpenChange={setCityOpen}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        disabled={isCityDisabled}
                        className="w-full bg-muted/30 border border-border rounded-lg p-3 text-sm text-foreground focus:border-primary focus:bg-white outline-none transition-all flex items-center justify-between text-left h-[48px] disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-muted/10"
                      >
                        <span className="truncate flex-grow pr-2">{selectedCity || "Select City..."}</span>
                        <span className="material-symbols-outlined text-muted-foreground shrink-0 text-base">expand_more</span>
                      </button>
                    </PopoverTrigger>
                    {!isCityDisabled && (
                      <PopoverContent className="bg-white border border-border shadow-lg max-h-[280px] overflow-hidden rounded-lg w-[var(--radix-popover-trigger-width)] p-0 z-50">
                        <Command>
                          <CommandInput 
                            placeholder="Search city..." 
                            value={citySearch} 
                            onValueChange={setCitySearch} 
                          />
                          <CommandList>
                            <CommandEmpty>No city found.</CommandEmpty>
                            <CommandGroup className="max-h-[200px] overflow-y-auto">
                              {filteredCities.map((city, idx) => (
                                <CommandItem
                                  key={`${city.name}-${idx}`}
                                  value={city.name}
                                  onSelect={() => {
                                    setSelectedCity(city.name);
                                    setCityOpen(false);
                                    setCitySearch("");
                                  }}
                                  className="cursor-pointer hover:bg-muted/50 p-2 text-sm rounded-md"
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
              </div>

              {/* Location Restriction Footnote */}
              <p className="text-[11px] text-muted-foreground italic -mt-2 mb-2 flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">info</span>
                Note: The current dataset and analytics are limited to Karnataka (Bangalore) only.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Duration (Est.)</label>
                  <div className="flex gap-2">
                    <input 
                      value={duration}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDuration(val === "" ? "" : Number(val));
                      }}
                      className="w-full bg-muted/30 border border-border rounded-lg p-3 text-sm text-foreground focus:border-primary focus:bg-white outline-none transition-all" 
                      type="number"
                      min="0"
                    />
                    <span className="flex items-center px-3 text-[10px] font-bold text-muted-foreground bg-muted border border-border rounded-lg uppercase">Min</span>
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Closure Status</label>
                  <div className="relative">
                    <select 
                      value={closureStatus}
                      onChange={(e) => setClosureStatus(e.target.value)}
                      className="w-full bg-muted/30 border border-border rounded-lg p-3 text-sm text-foreground focus:border-primary focus:bg-white outline-none transition-all appearance-none h-[48px]"
                    >
                      <option value="No Closure">No Closure</option>
                      <option value="Partial Closure">Partial Closure</option>
                      <option value="Full Closure">Full Closure</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none text-base">expand_more</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-baseline mb-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Attendance Estimate</label>
                  <span className="text-xs font-mono font-bold text-primary">{getAttendanceDisplay(attendance)}</span>
                </div>
                <input 
                  value={attendance}
                  onChange={(e) => setAttendance(Number(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary" 
                  type="range" 
                  min="0"
                  max="5"
                  step="0.01"
                />
                <div className="flex justify-between font-mono text-[9px] text-muted-foreground uppercase">
                  <span>0</span>
                  <span>1K</span>
                  <span>10K</span>
                  <span>50K</span>
                  <span>100K</span>
                  <span>100K+</span>
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
                  {results ? `${results.similarityScore.toFixed(0)}%` : "-"}
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
                  
                  {/* Reset Synthesis option removed completely */}
                </div>
              )}

            </div>

          </section>

        </div>

      </div>
    </>
  );
}

