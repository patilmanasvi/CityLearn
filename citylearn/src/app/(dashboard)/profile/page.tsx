// @ts-nocheck
"use client";

import React, { useEffect, useState } from "react";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  city: string;
  state: string;
  country: string;
  createdAt: string;
}

export default function Page() {
  const [user, setUser] = useState<UserProfile>({
    id: "mock-id-1234",
    name: "Alex Rivera",
    email: "a.rivera@citylearn.gov",
    role: "Senior Urban Logistics Architect",
    department: "City Operations AI",
    city: "San Francisco",
    state: "California",
    country: "United States",
    createdAt: new Date().toISOString()
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editDepartment, setEditDepartment] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editState, setEditState] = useState("");
  const [editCountry, setEditCountry] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Load user from localStorage
  const loadUser = () => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed) {
          setUser({
            id: parsed.id || "mock-id-1234",
            name: parsed.name || "Alex Rivera",
            email: parsed.email || "a.rivera@citylearn.gov",
            role: parsed.role || "Senior Urban Logistics Architect",
            department: parsed.department || "City Operations AI",
            city: parsed.city || "San Francisco",
            state: parsed.state || "California",
            country: parsed.country || "United States",
            createdAt: parsed.createdAt || new Date().toISOString()
          });
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  // Enter edit mode
  const handleStartEdit = () => {
    setEditName(user.name);
    setEditRole(user.role);
    setEditDepartment(user.department);
    setEditCity(user.city);
    setEditState(user.state);
    setEditCountry(user.country);
    setIsEditing(true);
  };

  // Save profile changes
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      alert("Name is required.");
      return;
    }

    setIsSaving(true);
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";

    try {
      const response = await fetch(`${baseUrl}/api/auth/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: user.id,
          name: editName,
          role: editRole,
          department: editDepartment,
          city: editCity,
          state: editState,
          country: editCountry
        })
      });

      if (!response.ok) {
        throw new Error("Profile update API failed");
      }

      const data = await response.json();
      if (data.success && data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
        setUser(data.user);
        setIsEditing(false);
        alert("Profile updated successfully!");
        // Refresh to reload SideNavBar
        window.location.reload();
      } else {
        alert(data.message || "Failed to update profile.");
      }
    } catch (err) {
      console.error(err);
      // Fallback update in localStorage if server fails
      const fallbackUser = {
        ...user,
        name: editName,
        role: editRole,
        department: editDepartment,
        city: editCity,
        state: editState,
        country: editCountry
      };
      localStorage.setItem("user", JSON.stringify(fallbackUser));
      setUser(fallbackUser);
      setIsEditing(false);
      alert("Profile updated locally. Please verify connection to Next.js API server.");
      window.location.reload();
    } finally {
      setIsSaving(false);
    }
  };

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
      ` }} />

      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="space-y-1">
          <h1 className="page-heading text-foreground">
            User Profile
          </h1>
          <p className="text-muted-foreground text-sm max-w-xl">
            Manage your credentials, view operational statistics, and check verification status.
          </p>
        </div>

        {/* Hero Section & Quick Actions */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 bg-white border border-border shadow-sm rounded-2xl p-8 relative overflow-hidden flex items-center">
            {isEditing ? (
              // Editing Form Mode
              <form onSubmit={handleSave} className="w-full space-y-4">
                <h3 className="text-sm font-bold text-primary uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Edit profile details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Full Name</label>
                    <input 
                      type="text" 
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full bg-slate-50 border border-border rounded-lg px-3 py-2 text-sm font-sans text-foreground focus:bg-white"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Role / Designation</label>
                    <input 
                      type="text" 
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value)}
                      className="w-full bg-slate-50 border border-border rounded-lg px-3 py-2 text-sm font-sans text-foreground focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Department</label>
                    <select 
                      value={editDepartment}
                      onChange={(e) => setEditDepartment(e.target.value)}
                      className="w-full bg-slate-50 border border-border rounded-lg px-3 py-2 text-sm font-sans text-foreground focus:bg-white"
                    >
                      <option>Urban Planning</option>
                      <option>Emergency Response</option>
                      <option>Transit Authority</option>
                      <option>Grid Management</option>
                      <option>Data Science</option>
                      <option>City Operations AI</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Primary City</label>
                    <input 
                      type="text" 
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                      className="w-full bg-slate-50 border border-border rounded-lg px-3 py-2 text-sm font-sans text-foreground focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">State / Province</label>
                    <input 
                      type="text" 
                      value={editState}
                      onChange={(e) => setEditState(e.target.value)}
                      className="w-full bg-slate-50 border border-border rounded-lg px-3 py-2 text-sm font-sans text-foreground focus:bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Country</label>
                    <input 
                      type="text" 
                      value={editCountry}
                      onChange={(e) => setEditCountry(e.target.value)}
                      className="w-full bg-slate-50 border border-border rounded-lg px-3 py-2 text-sm font-sans text-foreground focus:bg-white"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button 
                    type="submit" 
                    disabled={isSaving}
                    className="px-4 py-2 bg-primary text-primary-foreground font-bold text-xs rounded-lg hover:brightness-105 active:scale-95 transition-all disabled:opacity-75"
                  >
                    {isSaving ? "SAVING..." : "Save Changes"}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-white border border-border text-foreground font-bold text-xs rounded-lg hover:bg-slate-50 active:scale-95 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              // Display View Mode
              <div className="flex flex-col md:flex-row items-center md:items-center gap-6 relative z-10 w-full">
                
                {/* Profile Image */}
                <div className="relative">
                  <div className="w-32 h-32 md:w-36 md:h-36 rounded-2xl overflow-hidden border border-border shadow-sm bg-slate-50">
                    <img
                      alt="User avatar image"
                      className="w-full h-full object-cover"
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400"
                    />
                  </div>
                  <button 
                    onClick={handleStartEdit}
                    className="absolute -bottom-2 -right-2 w-9 h-9 bg-primary text-white rounded-lg shadow-sm flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
                  >
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                  </button>
                </div>

                {/* User Metadata */}
                <div className="text-center md:text-left space-y-2 flex-grow">
                  <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground leading-tight">{user.name}</h2>
                  <p className="text-muted-foreground text-sm font-semibold">
                    {user.role} • {user.department}
                  </p>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1 text-xs text-muted-foreground pt-2 border-t border-slate-100">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">location_on</span> {user.city}, {user.state}, {user.country}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">mail</span> {user.email}
                    </span>
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* Quick Actions Panel (1 Column) */}
          <div className="bg-white border border-border shadow-sm rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-6 flex items-center justify-between">
                Quick Actions
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              </h3>
              
              <div className="space-y-3">
                <button 
                  onClick={handleStartEdit}
                  className="w-full group flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100/70 border border-border rounded-xl transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary text-lg">person_edit</span>
                    <span className="text-xs font-bold text-foreground">Edit Profile</span>
                  </div>
                  <span className="material-symbols-outlined text-muted-foreground text-base group-hover:translate-x-1 transition-transform">chevron_right</span>
                </button>
                
                <button 
                  onClick={() => alert("Settings configuration: Auto location check and regional map center synced.")}
                  className="w-full group flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100/70 border border-border rounded-xl transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-secondary text-lg">map</span>
                    <span className="text-xs font-bold text-foreground">Location Settings</span>
                  </div>
                  <span className="material-symbols-outlined text-muted-foreground text-base group-hover:translate-x-1 transition-transform">chevron_right</span>
                </button>
                
                <button 
                  onClick={() => alert("Security status: Synaptic link verified, auth token rotating in 45m.")}
                  className="w-full group flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100/70 border border-border rounded-xl transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-amber-600 text-lg">security</span>
                    <span className="text-xs font-bold text-foreground">Security &amp; Access</span>
                  </div>
                  <span className="material-symbols-outlined text-muted-foreground text-base group-hover:translate-x-1 transition-transform">chevron_right</span>
                </button>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Account Health</span>
                <span className="text-xs font-bold text-primary font-mono">98% Secure</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: "98%" }}></div>
              </div>
            </div>
          </div>

        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Card 1 */}
          <div className="bg-white border border-border shadow-sm p-6 rounded-xl hover:border-primary/20 transition-colors">
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Events Analyzed</p>
            <h4 className="text-2xl font-bold text-primary font-mono">12,482</h4>
            <p className="text-[10px] text-green-600 font-semibold mt-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">trending_up</span> +12% this month
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white border border-border shadow-sm p-6 rounded-xl hover:border-secondary/20 transition-colors">
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Predictions</p>
            <h4 className="text-2xl font-bold text-secondary font-mono">842</h4>
            <p className="text-[10px] text-primary/70 font-semibold mt-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">check_circle</span> 94% Accuracy
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white border border-border shadow-sm p-6 rounded-xl hover:border-amber-400/50 transition-colors">
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Approved Actions</p>
            <h4 className="text-2xl font-bold text-amber-600 font-mono">319</h4>
            <p className="text-[10px] text-amber-700 font-semibold mt-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">bolt</span> High Impact Rank
            </p>
          </div>

          {/* Card 4 */}
          <div className="bg-white border border-border shadow-sm p-6 rounded-xl hover:border-slate-300 transition-colors">
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Simulations</p>
            <h4 className="text-2xl font-bold text-foreground font-mono">56</h4>
            <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">timer</span> 4.2h Avg/Week
            </p>
          </div>

        </section>

        {/* Charts & Activities */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Performance Chart (2 Columns) */}
          <div className="lg:col-span-2 bg-white border border-border shadow-sm p-8 rounded-xl">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-bold text-foreground">Impact Velocity</h3>
                <p className="text-muted-foreground text-xs">Quantifying operational efficiency over the last 30 days.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider font-mono">Active Output</span>
              </div>
            </div>

            {/* SVG Chart Area */}
            <div className="h-60 w-full relative">
              <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 800 200">
                <defs>
                  <linearGradient id="profileChartGrad" x1="0%" x2="0%" y1="0%" y2="100%">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.15"></stop>
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0"></stop>
                  </linearGradient>
                </defs>
                {/* Horizontal reference lines */}
                <line stroke="rgba(0,0,0,0.05)" strokeWidth="1" x1="0" x2="800" y1="50" y2="50"></line>
                <line stroke="rgba(0,0,0,0.05)" strokeWidth="1" x1="0" x2="800" y1="100" y2="100"></line>
                <line stroke="rgba(0,0,0,0.05)" strokeWidth="1" x1="0" x2="800" y1="150" y2="150"></line>
                
                {/* Area path */}
                <path d="M0,180 Q100,160 200,120 T400,100 T600,140 T800,40 L800,200 L0,200 Z" fill="url(#profileChartGrad)"></path>
                
                {/* Line path */}
                <path d="M0,180 Q100,160 200,120 T400,100 T600,140 T800,40" fill="none" stroke="hsl(var(--primary))" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></path>
                
                {/* Reference dots */}
                <circle cx="200" cy="120" fill="hsl(var(--primary))" r="4" className="ring-4 ring-primary/20"></circle>
                <circle cx="800" cy="40" fill="hsl(var(--primary))" r="4" className="ring-4 ring-primary/20"></circle>
              </svg>
              
              {/* X Axis labels */}
              <div className="flex justify-between mt-4 text-[9px] font-bold text-muted-foreground uppercase tracking-wider font-mono">
                <span>Wk 01</span>
                <span>Wk 02</span>
                <span>Wk 03</span>
                <span>Wk 04 (Current)</span>
              </div>
            </div>
          </div>

          {/* Recent Activity Feed (1 Column) */}
          <div className="bg-white border border-border shadow-sm p-8 rounded-xl flex flex-col justify-between">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-6">Recent Activity</h3>
            
            <div className="space-y-6 flex-grow">
              
              {/* Activity 1 */}
              <div className="flex gap-4">
                <div className="relative flex flex-col items-center">
                  <div className="w-9 h-9 rounded-full bg-secondary/10 text-secondary flex items-center justify-center border border-secondary/20">
                    <span className="material-symbols-outlined text-base">hub</span>
                  </div>
                  <div className="w-px h-8 bg-slate-100 mt-2"></div>
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">Simulation Approved</p>
                  <p className="text-[11px] text-muted-foreground leading-tight">L-9 Urban Corridor Optimization</p>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider font-mono mt-1">2 hours ago</p>
                </div>
              </div>

              {/* Activity 2 */}
              <div className="flex gap-4">
                <div className="relative flex flex-col items-center">
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                    <span className="material-symbols-outlined text-base">analytics</span>
                  </div>
                  <div className="w-px h-8 bg-slate-100 mt-2"></div>
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">Dataset Analysis Complete</p>
                  <p className="text-[11px] text-muted-foreground leading-tight">SF Transit Grid (Batch #442)</p>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider font-mono mt-1">5 hours ago</p>
                </div>
              </div>

              {/* Activity 3 */}
              <div className="flex gap-4">
                <div>
                  <div className="w-9 h-9 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
                    <span className="material-symbols-outlined text-base">notifications_active</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">Security Alert Handled</p>
                  <p className="text-[11px] text-muted-foreground leading-tight">API Gateway unauthorized attempt</p>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider font-mono mt-1">Yesterday</p>
                </div>
              </div>

            </div>
          </div>

        </section>

      </div>
    </>
  );
}
