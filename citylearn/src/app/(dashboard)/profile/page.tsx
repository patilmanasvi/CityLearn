// @ts-nocheck
"use client";

import React, { useEffect, useState } from "react";

export default function Page() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    address: "",
    department: "",
    role: "",
    country: "",
    state: "",
    city: "",
  });

  useEffect(() => {
    fetch("/api/auth/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setUser(data.user);
          setEditForm({
            name: data.user.name || "",
            email: data.user.email || "",
            address: data.user.address || "",
            department: data.user.department || "",
            role: data.user.role || "",
            country: data.user.country || "",
            state: data.user.state || "",
            city: data.user.city || "",
          });
        } else {
          window.location.href = "/sign-in";
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching user profile:", err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const runScript = () => {
      try {
        // Subtle micro-animations
        document.querySelectorAll("button").forEach((button) => {
          button.addEventListener("mousedown", () => {
            button.classList.add("scale-95");
          });
          button.addEventListener("mouseup", () => {
            button.classList.remove("scale-95");
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

  const getInitials = (name?: string) => {
    if (!name) return "";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getAvatarBg = (name?: string) => {
    if (!name) return "from-purple-600 to-indigo-600";
    const colors = [
      "from-purple-600 to-indigo-600",
      "from-blue-600 to-cyan-600",
      "from-emerald-600 to-teal-600",
      "from-orange-600 to-amber-600",
      "from-rose-600 to-pink-600",
      "from-violet-600 to-fuchsia-600"
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const handleDeleteProfile = async () => {
    const confirmed = window.confirm("Are you absolutely sure you want to permanently delete your profile? This action cannot be undone.");
    if (!confirmed) return;

    try {
      const response = await fetch("/api/auth/profile", {
        method: "DELETE",
      });
      const data = await response.json();
      if (data.success) {
        alert("Your profile has been permanently deleted.");
        window.location.href = "/sign-in";
      } else {
        alert(data.message || "Failed to delete profile. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting profile:", error);
      alert("An error occurred. Please try again.");
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await response.json();
      if (data.success) {
        setUser(data.user);
        setIsEditOpen(false);
        alert("Profile updated successfully!");
      } else {
        alert(data.message || "Failed to update profile.");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("An error occurred. Please try again.");
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
            <div className="flex flex-col md:flex-row items-center md:items-center gap-6 relative z-10 w-full">
              
              {/* Profile Image */}
              <div className="relative">
                <div className="w-32 h-32 md:w-36 md:h-36 rounded-2xl overflow-hidden border border-border shadow-sm bg-slate-50 flex items-center justify-center">
                  {user?.name ? (
                    <div className={`w-full h-full bg-gradient-to-br ${getAvatarBg(user.name)} text-white flex items-center justify-center text-4xl font-extrabold select-none`}>
                      {getInitials(user.name)}
                    </div>
                  ) : (
                    <div className="w-full h-full bg-slate-100 animate-pulse" />
                  )}
                </div>
                <button 
                  onClick={() => setIsEditOpen(true)}
                  className="absolute -bottom-2 -right-2 w-9 h-9 bg-primary text-white rounded-lg shadow-sm flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                </button>
              </div>

              {/* User Metadata */}
              <div className="text-center md:text-left space-y-2 flex-grow">
                <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground leading-tight">{user?.name || (loading ? "Loading..." : "Guest")}</h2>
                <p className="text-muted-foreground text-sm">
                  {user?.role || (loading ? "Loading..." : "Operator")} • {user?.department || (loading ? "Loading..." : "Operations")}
                </p>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1 text-xs text-muted-foreground pt-2 border-t border-slate-100">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">location_on</span> {user?.city ? `${user.city}, ${user.state || ""}`.trim() : (loading ? "Loading..." : "Unknown Location")}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">mail</span> {user?.email || (loading ? "Loading..." : "No Email")}
                  </span>
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
                  onClick={() => setIsEditOpen(true)}
                  className="w-full group flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100/70 border border-border rounded-xl transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary text-lg">person_edit</span>
                    <span className="text-xs font-bold text-foreground">Edit Profile</span>
                  </div>
                  <span className="material-symbols-outlined text-muted-foreground text-base group-hover:translate-x-1 transition-transform">chevron_right</span>
                </button>
                
                <button 
                  onClick={handleDeleteProfile}
                  className="w-full group flex items-center justify-between p-3.5 bg-red-50 hover:bg-red-100/70 border border-red-200 rounded-xl transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-red-600 text-lg">delete</span>
                    <span className="text-xs font-bold text-red-600">Delete Profile</span>
                  </div>
                  <span className="material-symbols-outlined text-red-600 text-base group-hover:translate-x-1 transition-transform">chevron_right</span>
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

      {/* Edit Profile Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">Edit Profile</h3>
              <button 
                onClick={() => setIsEditOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-muted-foreground hover:text-foreground transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            {/* Form */}
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Name</label>
                  <input 
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full bg-slate-50 border border-border rounded-lg p-2.5 text-sm text-foreground focus:bg-white focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email</label>
                  <input 
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full bg-slate-50 border border-border rounded-lg p-2.5 text-sm text-foreground focus:bg-white focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Address</label>
                  <input 
                    type="text"
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    className="w-full bg-slate-50 border border-border rounded-lg p-2.5 text-sm text-foreground focus:bg-white focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Department</label>
                  <input 
                    type="text"
                    value={editForm.department}
                    onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                    className="w-full bg-slate-50 border border-border rounded-lg p-2.5 text-sm text-foreground focus:bg-white focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Role</label>
                  <input 
                    type="text"
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="w-full bg-slate-50 border border-border rounded-lg p-2.5 text-sm text-foreground focus:bg-white focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Country</label>
                  <input 
                    type="text"
                    value={editForm.country}
                    onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                    className="w-full bg-slate-50 border border-border rounded-lg p-2.5 text-sm text-foreground focus:bg-white focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">State</label>
                  <input 
                    type="text"
                    value={editForm.state}
                    onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                    className="w-full bg-slate-50 border border-border rounded-lg p-2.5 text-sm text-foreground focus:bg-white focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">City</label>
                  <input 
                    type="text"
                    value={editForm.city}
                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                    className="w-full bg-slate-50 border border-border rounded-lg p-2.5 text-sm text-foreground focus:bg-white focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
              
              {/* Actions */}
              <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 border border-border rounded-lg text-sm text-foreground hover:bg-slate-50 active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:brightness-105 active:scale-95 transition-all flex items-center gap-1"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
