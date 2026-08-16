import React, { useState, useEffect, useRef } from "react";
import { 
  Lock, Unlock, Eye, EyeOff, ShieldCheck, AlertCircle, 
  Tv, KeyRound, CheckCircle2, ExternalLink, User, Shield, 
  UserCheck, AlertTriangle, ArrowRight, Sparkles, Crown, Zap
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { AuthSession } from "../types";
import { verifyAndUnlock, ADMIN_PASSWORD } from "../utils/auth";
import VipPackagesModal from "./VipPackagesModal";

interface LockScreenProps {
  onUnlock: (session: AuthSession) => void;
  lang?: "bn" | "en";
  isEmbed?: boolean;
}

type AuthMode = "user" | "admin";

export default function LockScreen({ onUnlock, lang = "bn", isEmbed = false }: LockScreenProps) {
  const [mode, setMode] = useState<AuthMode>("user");
  const [showVipModal, setShowVipModal] = useState(false);
  
  // User Login State
  const [username, setUsername] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [showUserPassword, setShowUserPassword] = useState(false);

  // Admin Login State
  const [adminPassword, setAdminPassword] = useState("");
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  // Shared States
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isAccountLocked, setIsAccountLocked] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const userInputRef = useRef<HTMLInputElement>(null);
  const adminInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mode === "user") {
      userInputRef.current?.focus();
    } else {
      adminInputRef.current?.focus();
    }
    setError(false);
    setIsAccountLocked(false);
  }, [mode]);

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError(true);
      setIsAccountLocked(false);
      setErrorMessage(
        lang === "bn" ? "অনুগ্রহ করে ইউজারনেম লিখুন।" : "Please enter your username."
      );
      userInputRef.current?.focus();
      return;
    }

    if (!userPassword) {
      setError(true);
      setIsAccountLocked(false);
      setErrorMessage(
        lang === "bn" ? "অনুগ্রহ করে পাসওয়ার্ড লিখুন।" : "Please enter your password."
      );
      return;
    }

    setIsSubmitting(true);
    setError(false);
    setIsAccountLocked(false);

    const res = await verifyAndUnlock({
      type: "user",
      username: username.trim(),
      password: userPassword,
    });

    setIsSubmitting(false);

    if (res.success && res.session) {
      setIsSuccess(true);
      setTimeout(() => {
        onUnlock(res.session!);
      }, 400);
    } else {
      setError(true);
      if (res.isLocked) {
        setIsAccountLocked(true);
        setErrorMessage(
          lang === "bn"
            ? "আপনার অ্যাকাউন্টটি এডমিন কর্তৃক লক করা হয়েছে! এডমিনের সাথে যোগাযোগ করুন।"
            : "Your account is locked by admin! Please contact administrator."
        );
      } else {
        setErrorMessage(
          res.error ||
            (lang === "bn"
              ? "ভুল ইউজারনেম অথবা পাসওয়ার্ড!"
              : "Incorrect username or password!")
        );
      }
    }
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPassword) {
      setError(true);
      setErrorMessage(
        lang === "bn" ? "অনুগ্রহ করে এডমিন পাসওয়ার্ড লিখুন।" : "Please enter the admin password."
      );
      adminInputRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    setError(false);

    const res = await verifyAndUnlock({
      type: "admin",
      password: adminPassword,
    });

    setIsSubmitting(false);

    if (res.success && res.session) {
      setIsSuccess(true);
      setTimeout(() => {
        onUnlock(res.session!);
      }, 400);
    } else {
      setError(true);
      setErrorMessage(
        lang === "bn"
          ? "ভুল এডমিন পাসওয়ার্ড! সঠিক পাসওয়ার্ড দিন।"
          : "Incorrect admin password! Please enter the correct password."
      );
      adminInputRef.current?.select();
    }
  };

  return (
    <div
      id="site-lock-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#050505] text-neutral-100 font-sans p-4 sm:p-6 overflow-y-auto select-none"
    >
      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-gradient-to-b from-red-950/30 via-neutral-950/80 to-[#050505] pointer-events-none" />
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[650px] h-[650px] bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className={`relative z-10 w-full ${isEmbed ? "max-w-xs" : "max-w-md"} bg-neutral-900/95 border border-neutral-800 rounded-3xl p-5 sm:p-7 shadow-2xl backdrop-blur-xl flex flex-col items-center text-center my-auto`}
      >
        {/* Brand Icon / Lock Badge */}
        <div className="relative mb-3">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-red-600 to-red-950 p-0.5 shadow-xl shadow-red-950/50 flex items-center justify-center">
            <div className="w-full h-full bg-[#0a0a0a] rounded-[14px] flex items-center justify-center">
              {isSuccess ? (
                <Unlock className="w-7 h-7 sm:w-8 sm:h-8 text-green-500 animate-bounce" />
              ) : mode === "admin" ? (
                <Shield className="w-7 h-7 sm:w-8 sm:h-8 text-red-500" />
              ) : (
                <Lock className="w-7 h-7 sm:w-8 sm:h-8 text-red-500" />
              )}
            </div>
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-red-600 rounded-full border-2 border-neutral-900 flex items-center justify-center shadow-md">
            {mode === "admin" ? (
              <KeyRound className="w-3 h-3 text-white" />
            ) : (
              <User className="w-3 h-3 text-white" />
            )}
          </div>
        </div>

        {/* Header Title */}
        <div className="flex items-center gap-1.5 mb-1">
          <div className="w-4 h-4 rounded bg-red-600/20 flex items-center justify-center">
            <Tv className="w-2.5 h-2.5 text-red-500" />
          </div>
          <span className="text-[11px] font-black tracking-wider uppercase italic text-red-500 font-sans">
            IreenTV Live Sports
          </span>
        </div>

        <h2 className="text-lg sm:text-xl font-black text-white tracking-tight mb-1 font-sans">
          {lang === "bn" ? "ওয়েবসাইট অ্যাক্সেস সুরক্ষা" : "Website Access Gate"}
        </h2>

        <p className="text-xs text-neutral-400 font-sans leading-relaxed mb-4 max-w-xs">
          {lang === "bn"
            ? "লাইভ চ্যানেল ও স্পোর্টস দেখতে আনলক করুন।"
            : "Please unlock to access live sports & TV channels."}
        </p>

        {/* Dual Mode Switcher Tabs */}
        <div className="w-full bg-neutral-950 p-1 rounded-2xl border border-neutral-800 flex items-center mb-3 text-xs font-bold font-sans">
          <button
            type="button"
            id="tab-user-unlock"
            onClick={() => {
              setMode("user");
              setError(false);
              setIsAccountLocked(false);
            }}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              mode === "user"
                ? "bg-red-600 text-white shadow-md shadow-red-950/40"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>{lang === "bn" ? "ইউজার আনলক" : "User Unlock"}</span>
          </button>

          <button
            type="button"
            id="tab-admin-unlock"
            onClick={() => {
              setMode("admin");
              setError(false);
              setIsAccountLocked(false);
            }}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              mode === "admin"
                ? "bg-red-600 text-white shadow-md shadow-red-950/40"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>{lang === "bn" ? "এডমিন আনলক" : "Admin Unlock"}</span>
          </button>
        </div>

        {/* Buy VIP Package Action Button */}
        <button
          type="button"
          id="btn-buy-vip-package"
          onClick={() => setShowVipModal(true)}
          className="w-full mb-4 py-2.5 px-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-red-600/25 to-purple-600/20 hover:from-amber-500/30 hover:via-red-600/35 hover:to-purple-600/30 border border-amber-500/50 hover:border-amber-400 text-amber-200 transition-all flex items-center justify-between group active:scale-[0.98] shadow-lg shadow-amber-950/30"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-red-600 p-0.5 flex items-center justify-center shrink-0 shadow-md">
              <div className="w-full h-full bg-neutral-950 rounded-[10px] flex items-center justify-center">
                <Crown className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
              </div>
            </div>
            <div className="text-left">
              <div className="text-xs font-black text-white flex items-center gap-1.5 tracking-tight">
                <span>{lang === "bn" ? "Buy VIP package" : "Buy VIP package"}</span>
                <span className="px-1.5 py-0.2 rounded bg-red-600 text-[9px] font-bold text-white uppercase">
                  VIP
                </span>
              </div>
              <p className="text-[10px] text-amber-300/80 font-medium">
                {lang === "bn" ? "৭ দিন ৫০৳ • ১ মাস ১৫০৳ • স্পোর্টস ও মুভি" : "7 Days 50৳ • 1 Mo 150৳ • Sports & Cinema"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-bold text-amber-400 group-hover:translate-x-0.5 transition-transform shrink-0">
            <span>{lang === "bn" ? "প্যাকেজ দেখুন" : "View"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </button>

        {/* FORM CONTAINER */}
        <div className="w-full">
          {mode === "user" ? (
            /* USER UNLOCK FORM (Username & Password) */
            <form onSubmit={handleUserSubmit} className="w-full flex flex-col gap-3">
              {/* Username field */}
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-neutral-500 pointer-events-none">
                  <User className="w-4 h-4" />
                </span>
                <input
                  ref={userInputRef}
                  id="user-username-input"
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (error) setError(false);
                  }}
                  placeholder={lang === "bn" ? "ইউজারনেম (Username)" : "Username"}
                  autoComplete="username"
                  className={`w-full bg-[#050505] border text-xs sm:text-sm text-white placeholder-neutral-500 rounded-xl py-2.5 sm:py-3 pl-10 pr-3 transition-all font-mono focus:outline-none ${
                    error
                      ? "border-red-500 ring-2 ring-red-500/20"
                      : "border-neutral-800 focus:border-red-600 focus:ring-2 focus:ring-red-600/20"
                  }`}
                />
              </div>

              {/* User Password field */}
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-neutral-500 pointer-events-none">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  id="user-password-input"
                  type={showUserPassword ? "text" : "password"}
                  value={userPassword}
                  onChange={(e) => {
                    setUserPassword(e.target.value);
                    if (error) setError(false);
                  }}
                  placeholder={lang === "bn" ? "পাসওয়ার্ড (Password)" : "Password"}
                  autoComplete="current-password"
                  className={`w-full bg-[#050505] border text-xs sm:text-sm text-white placeholder-neutral-500 rounded-xl py-2.5 sm:py-3 pl-10 pr-10 transition-all font-mono focus:outline-none ${
                    error
                      ? "border-red-500 ring-2 ring-red-500/20"
                      : "border-neutral-800 focus:border-red-600 focus:ring-2 focus:ring-red-600/20"
                  }`}
                />
                <button
                  type="button"
                  id="toggle-user-password"
                  onClick={() => setShowUserPassword(!showUserPassword)}
                  className="absolute right-3 p-1 text-neutral-500 hover:text-neutral-200 transition-colors"
                >
                  {showUserPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className={`flex items-start gap-1.5 text-xs font-sans p-2 rounded-xl text-left ${
                      isAccountLocked
                        ? "bg-red-950/60 border border-red-800 text-red-300"
                        : "bg-red-950/30 text-red-400"
                    }`}
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold">{errorMessage}</p>
                      {isAccountLocked && (
                        <p className="text-[11px] text-neutral-400 mt-1">
                          আপনার আইডি চালু করাতে এডমিনের সাথে যোগাযোগ করুন।
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Remember option */}
              <div className="flex items-center justify-between text-[11px] text-neutral-400 px-1">
                <label className="flex items-center gap-2 cursor-pointer select-none hover:text-neutral-300">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded bg-neutral-900 border-neutral-800 text-red-600 accent-red-600 cursor-pointer"
                  />
                  <span>{lang === "bn" ? "মনে রাখুন" : "Remember login"}</span>
                </label>
                <span className="text-[10px] text-neutral-500 font-mono">
                  <ShieldCheck className="w-3 h-3 inline-block mr-1 text-neutral-500" />
                  User Protected
                </span>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                id="unlock-user-button"
                disabled={isSubmitting}
                className={`w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg ${
                  isSuccess
                    ? "bg-green-600 text-white shadow-green-600/30"
                    : "bg-red-600 hover:bg-red-500 text-white shadow-red-600/30"
                }`}
              >
                {isSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{lang === "bn" ? "আনলক হয়েছে..." : "Unlocked..."}</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-4 h-4" />
                    <span>{lang === "bn" ? "ইউজার প্রবেশ করুন" : "Unlock as User"}</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* ADMIN UNLOCK FORM (Password Only) */
            <form onSubmit={handleAdminSubmit} className="w-full flex flex-col gap-3">
              <div className="bg-red-950/20 border border-red-900/40 rounded-xl p-2 text-left mb-1 flex items-center gap-2">
                <Shield className="w-4 h-4 text-red-400 shrink-0" />
                <span className="text-[11px] text-neutral-300">
                  {lang === "bn"
                    ? "এডমিন কেবল পাসওয়ার্ড দিয়ে সরাসরি আনলক ও ইউজার কন্ট্রোল করতে পারবেন।"
                    : "Admin can unlock with master password and manage users."}
                </span>
              </div>

              {/* Admin Password Input */}
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-neutral-500 pointer-events-none">
                  <KeyRound className="w-4 h-4 text-red-500" />
                </span>
                <input
                  ref={adminInputRef}
                  id="admin-password-input"
                  type={showAdminPassword ? "text" : "password"}
                  value={adminPassword}
                  onChange={(e) => {
                    setAdminPassword(e.target.value);
                    if (error) setError(false);
                  }}
                  placeholder={lang === "bn" ? "এডমিন পাসওয়ার্ড দিন..." : "Admin Password..."}
                  autoComplete="current-password"
                  className={`w-full bg-[#050505] border text-xs sm:text-sm text-white placeholder-neutral-500 rounded-xl py-2.5 sm:py-3 pl-10 pr-10 transition-all font-mono focus:outline-none ${
                    error
                      ? "border-red-500 ring-2 ring-red-500/20"
                      : "border-neutral-800 focus:border-red-600 focus:ring-2 focus:ring-red-600/20"
                  }`}
                />
                <button
                  type="button"
                  id="toggle-admin-password"
                  onClick={() => setShowAdminPassword(!showAdminPassword)}
                  className="absolute right-3 p-1 text-neutral-500 hover:text-neutral-200 transition-colors"
                >
                  {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="flex items-center gap-1.5 text-red-400 text-xs font-sans text-left px-1"
                  >
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />
                    <span>{errorMessage}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Remember option */}
              <div className="flex items-center justify-between text-[11px] text-neutral-400 px-1">
                <label className="flex items-center gap-2 cursor-pointer select-none hover:text-neutral-300">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded bg-neutral-900 border-neutral-800 text-red-600 accent-red-600 cursor-pointer"
                  />
                  <span>{lang === "bn" ? "মনে রাখুন" : "Remember on this device"}</span>
                </label>
                <span className="text-[10px] text-red-400 font-mono flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-red-500" />
                  Admin Mode
                </span>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                id="unlock-admin-button"
                disabled={isSubmitting}
                className={`w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg ${
                  isSuccess
                    ? "bg-green-600 text-white shadow-green-600/30"
                    : "bg-red-600 hover:bg-red-500 text-white shadow-red-600/30"
                }`}
              >
                {isSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{lang === "bn" ? "এডমিন আনলক হয়েছে..." : "Admin Unlocked..."}</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>{lang === "bn" ? "এডমিন আনলক করুন" : "Unlock as Admin"}</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer Note & Admin Contact */}
        <div className="mt-5 pt-3.5 border-t border-neutral-800/80 w-full flex flex-col items-center justify-center gap-2 text-xs text-neutral-400 font-sans">
          <p className="text-[11px] text-neutral-500">
            {lang === "bn" ? "আইডি বা পাসওয়ার্ডের জন্য এডমিনের সাথে যোগাযোগ করুন:" : "Need an ID or password? Contact admin:"}
          </p>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <a
              id="admin-contact-link"
              href="https://anamul.pages.dev/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-neutral-800/70 hover:bg-neutral-800 text-red-400 hover:text-red-300 font-medium text-xs border border-neutral-700/60 hover:border-red-600/50 transition-all active:scale-95 shadow-sm"
            >
              <User className="w-3.5 h-3.5 text-red-500" />
              <span className="font-semibold">
                {lang === "bn" ? "এডমিন যোগাযোগ (Admin Contact)" : "Admin Contact"}
              </span>
              <ExternalLink className="w-3 h-3 text-neutral-400 ml-0.5" />
            </a>

            <button
              type="button"
              id="lock-vip-pill-btn"
              onClick={() => setShowVipModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 font-medium text-xs border border-amber-800/50 hover:border-amber-600 transition-all active:scale-95 shadow-sm"
            >
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>{lang === "bn" ? "VIP প্যাকেজ রেট" : "VIP Pricing"}</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* VIP Packages Modal */}
      <AnimatePresence>
        {showVipModal && (
          <VipPackagesModal
            isOpen={showVipModal}
            onClose={() => setShowVipModal(false)}
            lang={lang}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
