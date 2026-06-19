// @ts-nocheck
"use client";

import React, { useEffect } from "react";
import { CrowdCanvas } from "@/components/shared/CrowdCanvas";
import { AuthToast } from "@/components/shared/AuthToast";

export default function Page() {
  const [showPassword, setShowPassword] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
  const [toastType, setToastType] = React.useState<"error" | "success">("error");

  const showToast = (message: string, type: "error" | "success" = "error") => {
    setToastType(type);
    setToastMessage(message);
  };

  useEffect(() => {
    const runScript = () => {
      try {

        // Form Submission Interaction
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
          loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = loginForm.querySelector('button[type="submit"]');
            const emailInput = document.getElementById('email') as HTMLInputElement | null;
            const passwordInput = document.getElementById('password') as HTMLInputElement | null;

            if (!btn || !emailInput || !passwordInput) return;

            const originalContent = btn.innerHTML;
            const originalClassName = btn.className;
            btn.innerHTML = '<span class="material-symbols-outlined animate-spin text-sm mr-1">refresh</span> Validating...';
            btn.disabled = true;
            btn.style.opacity = '0.7';

            try {
              const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  email: emailInput.value,
                  password: passwordInput.value,
                }),
              });

              const data = await response.json();

              if (!response.ok || !data.success) {
                showToast(data.message || 'Login failed. Please try again.');
                btn.innerHTML = originalContent;
                btn.className = originalClassName;
                btn.disabled = false;
                btn.style.opacity = '';
                return;
              }

              btn.innerHTML = '<span class="material-symbols-outlined text-sm mr-1">check_circle</span> Authenticated';
              btn.className = "w-full bg-green-600 text-white font-body-md font-bold py-4 rounded-lg flex items-center justify-center gap-2 shadow-lg";
              if (data.user) {
                localStorage.setItem("user", JSON.stringify(data.user));
              }
              setTimeout(() => { window.location.href = '/dashboard'; }, 800);
            } catch {
              showToast('Unable to connect. Please try again.');
              btn.innerHTML = originalContent;
              btn.className = originalClassName;
              btn.disabled = false;
              btn.style.opacity = '';
            }
          });
        }

        // Micro-interaction for inputs
        document.querySelectorAll('input').forEach(input => {
          input.addEventListener('focus', () => {
            const icon = input.parentElement.querySelector('.material-symbols-outlined');
            if (icon) icon.style.color = 'hsl(263, 70%, 50%)';
          });
          input.addEventListener('blur', () => {
            const icon = input.parentElement.querySelector('.material-symbols-outlined');
            if (icon) icon.style.color = '';
          });
        });
      } catch (e) {
        console.error("Error running page script:", e);
      }
    };
    runScript();
  }, []);

  return (
    <>
      {toastMessage && (
        <AuthToast
          message={toastMessage}
          type={toastType}
          onClose={() => setToastMessage(null)}
        />
      )}
      <style dangerouslySetInnerHTML={{ __html: `.material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        input:focus {
          outline: none;
          box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.2);
        }
        /* Suppress browser-default password reveal eye icon */
        input::-ms-reveal,
        input::-ms-clear {
          display: none;
        }
        /* Custom scrollbar */
        ::-webkit-scrollbar {
            width: 4px;
        }
        ::-webkit-scrollbar-track {
            background: transparent;
        }
        ::-webkit-scrollbar-thumb {
            background: rgba(133, 147, 153, 0.2);
            border-radius: 10px;
        }` }} />
      <div className="relative min-h-screen bg-background text-foreground font-sans overflow-x-hidden flex flex-col justify-between">
        
        {/* Animated Background */}
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-purple-50/20 via-white to-blue-50/20 pointer-events-none">
          <CrowdCanvas src="/images/peeps/all-peeps.png" rows={15} cols={7} />
        </div>

        {/* Header (Simplified) */}
        <header className="relative z-10 w-full h-16 flex items-center px-6 md:px-12 bg-white/70 backdrop-blur-md border-b border-border">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-2xl" style={{"fontVariationSettings": "'FILL' 1"}}>network_intelligence</span>
            <h1 className="font-croissant text-xl md:text-2xl font-bold tracking-tight text-foreground">CityLearn</h1>
          </div>
        </header>

        {/* Main Card */}
        <main className="relative z-10 w-full flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-[460px]">
            {/* Tagline */}
            <div className="mb-8 text-center select-none overflow-visible">
              <h2 className="font-display text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-black to-blue-600 bg-clip-text text-transparent pb-2 px-2 whitespace-nowrap">
                Welcome to <span className="font-croissant">CityLearn</span>!
              </h2>
              <div className="mx-auto w-16 h-1 bg-gradient-to-r from-black to-blue-600 rounded-full opacity-85 mt-3"></div>
            </div>

            {/* Login Card */}
            <div className="bg-white border border-border shadow-xl rounded-2xl p-8 transition-all duration-300">
              <form className="space-y-5" id="login-form">
                
                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block" htmlFor="email">Email Address</label>
                  <div className="relative group">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-base transition-colors duration-200">mail</span>
                    <input className="w-full bg-muted/30 border border-border rounded-lg py-3 pl-10 pr-4 text-sm font-sans text-foreground transition-all focus:bg-white focus:border-primary" id="email" placeholder="operator@city.gov" required="" type="email"/>
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block" htmlFor="password">Password</label>
                    <a className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors" href="#">Forgot password?</a>
                  </div>
                  <div className="relative group">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-base transition-colors duration-200">lock</span>
                    <input className="w-full bg-muted/30 border border-border rounded-lg py-3 pl-10 pr-12 text-sm font-sans text-foreground transition-all focus:bg-white focus:border-primary" id="password" placeholder="••••••••••••" required="" type={showPassword ? "text" : "password"}/>
                    <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary p-1" id="toggle-password" type="button" onClick={() => setShowPassword(!showPassword)}>
                      <span className="material-symbols-outlined text-base">{showPassword ? "visibility" : "visibility_off"}</span>
                    </button>
                  </div>
                </div>

                {/* Remember Session */}
                <div className="flex items-center gap-2 py-1">
                  <input className="w-4 h-4 rounded border-border bg-muted/30 text-primary focus:ring-primary/20 accent-primary" id="remember" type="checkbox"/>
                  <label className="text-xs text-muted-foreground font-semibold cursor-pointer select-none" htmlFor="remember">Keep me signed in for this session</label>
                </div>

                {/* Submit */}
                <button className="w-full bg-primary text-primary-foreground font-sans font-bold py-4 rounded-lg hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/10" type="submit">
                  <span className="material-symbols-outlined text-lg" style={{"fontVariationSettings": "'FILL' 1"}}>login</span>
                  Sign In
                </button>
              </form>

              {/* Register link inside the card */}
              <div className="mt-8 pt-6 border-t border-border text-center">
                <p className="text-sm text-muted-foreground">
                  New User? <a className="text-primary font-bold hover:underline" href="/sign-up">Register Here</a>
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
