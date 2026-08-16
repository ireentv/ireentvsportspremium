import React, { useState, useEffect, useRef } from "react";
import { Lock, Unlock, Eye, EyeOff, ShieldCheck, AlertCircle, Tv, KeyRound, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface LockScreenProps {
  onUnlock: () => void;
  lang?: "bn" | "en";
  isEmbed?: boolean;
}

const SITE_PASSWORD = "Bachchufeni";

export default function LockScreen({ onUnlock, lang = "bn", isEmbed = false }: LockScreenProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus password input automatically on mount
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError(true);
      setErrorMessage(
        lang === "bn"
          ? "অনুগ্রহ করে পাসওয়ার্ড লিখুন।"
          : "Please enter the password."
      );
      inputRef.current?.focus();
      return;
    }

    if (password === SITE_PASSWORD) {
      setError(false);
      setIsSuccess(true);
      
      try {
        if (rememberMe) {
          localStorage.setItem("ireentv_unlocked", "true");
        } else {
          sessionStorage.setItem("ireentv_unlocked", "true");
        }
      } catch (err) {
        console.error("Failed to store lock state in storage", err);
      }

      setTimeout(() => {
        onUnlock();
      }, 400);
    } else {
      setError(true);
      setIsSuccess(false);
      setErrorMessage(
        lang === "bn"
          ? "ভুল পাসওয়ার্ড! সঠিক পাসওয়ার্ড দিয়ে আনলক করুন।"
          : "Incorrect password! Please enter the correct password."
      );
      // Select input text for easy re-typing
      inputRef.current?.select();
    }
  };

  return (
    <div
      id="site-lock-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#050505] text-neutral-100 font-sans p-4 sm:p-6 overflow-hidden select-none"
    >
      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-gradient-to-b from-red-950/25 via-neutral-950/80 to-[#050505] pointer-events-none" />
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className={`relative z-10 w-full ${isEmbed ? "max-w-xs" : "max-w-md"} bg-neutral-900/90 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl flex flex-col items-center text-center`}
      >
        {/* Brand Icon / Lock Badge */}
        <div className="relative mb-5">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-red-600 to-red-950 p-0.5 shadow-xl shadow-red-950/50 flex items-center justify-center">
            <div className="w-full h-full bg-[#0a0a0a] rounded-[14px] flex items-center justify-center">
              {isSuccess ? (
                <Unlock className="w-8 h-8 sm:w-10 sm:h-10 text-green-500 animate-bounce" />
              ) : (
                <Lock className="w-8 h-8 sm:w-10 sm:h-10 text-red-500" />
              )}
            </div>
          </div>
          <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-red-600 rounded-full border-2 border-neutral-900 flex items-center justify-center shadow-md">
            <KeyRound className="w-3.5 h-3.5 text-white" />
          </div>
        </div>

        {/* Header Title */}
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-5 h-5 rounded-lg bg-red-600/20 flex items-center justify-center">
            <Tv className="w-3 h-3 text-red-500" />
          </div>
          <span className="text-xs font-black tracking-widest uppercase italic text-red-500 font-sans">
            IreenTV Live Sports
          </span>
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-2 font-sans">
          {lang === "bn" ? "সুরক্ষিত ওয়েবসাইট" : "Protected Website"}
        </h2>

        <p className="text-xs sm:text-sm text-neutral-400 font-sans leading-relaxed mb-6 max-w-xs">
          {lang === "bn"
            ? "ওয়েবসাইটের লাইভ স্পোর্টস ও চ্যানেল দেখতে পাসওয়ার্ড দিয়ে আনলক করুন।"
            : "Please enter the access password to unlock live sports & channels."}
        </p>

        {/* Unlock Form */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <motion.div
            animate={error ? { x: [-8, 8, -6, 6, -3, 3, 0] } : {}}
            transition={{ duration: 0.4 }}
            className="relative w-full"
          >
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-neutral-500 pointer-events-none">
                <Lock className={`w-4 h-4 transition-colors ${error ? "text-red-500" : "text-neutral-500"}`} />
              </span>
              
              <input
                ref={inputRef}
                id="site-password-input"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(false);
                }}
                placeholder={lang === "bn" ? "পাসওয়ার্ড লিখুন..." : "Enter password..."}
                autoComplete="current-password"
                className={`w-full bg-[#050505] border text-sm sm:text-base text-white placeholder-neutral-500 rounded-xl py-3 pl-10 pr-11 transition-all font-mono focus:outline-none ${
                  error
                    ? "border-red-500 ring-2 ring-red-500/20 focus:border-red-500"
                    : isSuccess
                    ? "border-green-500 ring-2 ring-green-500/20 focus:border-green-500"
                    : "border-neutral-800 focus:border-red-600 focus:ring-2 focus:ring-red-600/20"
                }`}
              />

              <button
                type="button"
                id="toggle-password-visibility"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 p-1 text-neutral-500 hover:text-neutral-200 transition-colors"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="flex items-center gap-1.5 text-red-400 text-xs font-sans mt-2 text-left px-1"
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />
                  <span>{errorMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Remember me option */}
          <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
            <label className="flex items-center gap-2 cursor-pointer select-none hover:text-neutral-300">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded bg-neutral-900 border-neutral-800 text-red-600 focus:ring-0 focus:ring-offset-0 accent-red-600 cursor-pointer"
              />
              <span>{lang === "bn" ? "এই ব্রাউজারে মনে রাখুন" : "Remember on this device"}</span>
            </label>
            <span className="text-[10px] text-neutral-600 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 inline-block mr-1 text-neutral-500" />
              Secure
            </span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            id="unlock-site-button"
            className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg ${
              isSuccess
                ? "bg-green-600 hover:bg-green-500 text-white shadow-green-600/30"
                : "bg-red-600 hover:bg-red-500 text-white shadow-red-600/30"
            }`}
          >
            {isSuccess ? (
              <>
                <CheckCircle2 className="w-5 h-5 animate-spin-slow" />
                <span>{lang === "bn" ? "আনলক হয়েছে..." : "Unlocked..."}</span>
              </>
            ) : (
              <>
                <Unlock className="w-4 h-4" />
                <span>{lang === "bn" ? "আনলক করুন" : "Unlock Website"}</span>
              </>
            )}
          </button>
        </form>

        {/* Footer Note */}
        <div className="mt-6 pt-4 border-t border-neutral-800/80 w-full flex items-center justify-center gap-2 text-[11px] text-neutral-500 font-sans">
          <span>পাসওয়ার্ড প্রয়োজন হলে এডমিনের সাথে যোগাযোগ করুন</span>
        </div>
      </motion.div>
    </div>
  );
}
