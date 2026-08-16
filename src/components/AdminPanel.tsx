import React, { useState, useEffect } from "react";
import { 
  Users, UserPlus, Lock, Unlock, Key, Trash2, Edit3, 
  Copy, Check, Search, Shield, RefreshCw, X, AlertTriangle, 
  Eye, EyeOff, ShieldAlert, Sparkles, CheckCircle2, UserCheck, 
  UserX, ExternalLink, ArrowLeft, Clock
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ManagedUser, Language } from "../types";
import { 
  fetchAdminUsers, createAdminUser, updateAdminUser, 
  deleteAdminUser, ADMIN_PASSWORD 
} from "../utils/auth";

interface AdminPanelProps {
  onClose: () => void;
  lang?: Language;
}

export default function AdminPanel({ onClose, lang = "bn" }: AdminPanelProps) {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "locked">("all");

  // Form states for creating a new user
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // Edit User Modal state
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [editPassword, setEditPassword] = useState("");
  const [editName, setEditName] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editError, setEditError] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete User Confirmation Modal state
  const [userToDelete, setUserToDelete] = useState<ManagedUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast Notification state
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  const showToast = (type: "success" | "error" | "info", message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast((current) => (current?.message === message ? null : current));
    }, 3500);
  };

  // Visible passwords mapping
  const [visiblePasswords, setVisiblePasswords] = useState<{ [id: string]: boolean }>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load users on mount
  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAdminUsers(ADMIN_PASSWORD);
      setUsers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Generate random password helper
  const handleGeneratePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    let pwd = "";
    for (let i = 0; i < 6; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pwd);
  };

  // Create User Handler
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!newUsername.trim()) {
      setFormError(lang === "bn" ? "ইউজারনেম দিন।" : "Please provide a username.");
      return;
    }
    if (!newPassword.trim()) {
      setFormError(lang === "bn" ? "পাসওয়ার্ড দিন।" : "Please provide a password.");
      return;
    }

    setIsCreating(true);
    const result = await createAdminUser(
      {
        username: newUsername.trim(),
        password: newPassword.trim(),
        name: newName.trim() || undefined,
        notes: newNotes.trim() || undefined,
      },
      ADMIN_PASSWORD
    );
    setIsCreating(false);

    if (result.success && result.user) {
      setUsers((prev) => [result.user!, ...prev.filter((u) => u.id !== result.user!.id)]);
      setFormSuccess(
        lang === "bn"
          ? `ইউজার "${result.user.username}" সফলভাবে তৈরি হয়েছে!`
          : `User "${result.user.username}" created successfully!`
      );
      setNewUsername("");
      setNewPassword("");
      setNewName("");
      setNewNotes("");
      setTimeout(() => setFormSuccess(""), 4000);
    } else {
      setFormError(result.error || (lang === "bn" ? "ইউজার তৈরি করা সম্ভব হয়নি।" : "Failed to create user."));
    }
  };

  // Toggle User Lock / Unlock
  const handleToggleLock = async (user: ManagedUser) => {
    const nextLockedState = !user.isLocked;
    
    // Optimistic UI update
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, isLocked: nextLockedState } : u))
    );

    const result = await updateAdminUser(
      user.id,
      { isLocked: nextLockedState },
      ADMIN_PASSWORD
    );

    if (result.success) {
      showToast(
        "success",
        lang === "bn"
          ? `ইউজার @${user.username} কে ${nextLockedState ? "লক" : "আনলক"} করা হয়েছে।`
          : `User @${user.username} ${nextLockedState ? "locked" : "unlocked"} successfully.`
      );
    } else {
      // Revert if failed
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, isLocked: user.isLocked } : u))
      );
      showToast("error", result.error || (lang === "bn" ? "লক/আনলক পরিবর্তন করা সম্ভব হয়নি।" : "Failed to change lock state."));
    }
  };

  // Open Delete Confirmation Modal
  const handleRequestDelete = (user: ManagedUser) => {
    setUserToDelete(user);
  };

  // Confirm Delete User Action
  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    const targetUser = userToDelete;
    setIsDeleting(true);

    // Optimistic UI update
    setUsers((prev) => prev.filter((u) => u.id !== targetUser.id));

    const result = await deleteAdminUser(targetUser.id, ADMIN_PASSWORD);
    setIsDeleting(false);
    setUserToDelete(null);

    if (result.success) {
      showToast(
        "success",
        lang === "bn"
          ? `ইউজার @${targetUser.username} সফলভাবে ডিলিট করা হয়েছে!`
          : `User @${targetUser.username} deleted successfully!`
      );
    } else {
      showToast("error", result.error || (lang === "bn" ? "ইউজার মুছতে সমস্যা হয়েছে।" : "Failed to delete user."));
      loadUsers();
    }
  };

  // Open Edit modal
  const handleOpenEdit = (user: ManagedUser) => {
    setEditingUser(user);
    setEditPassword(user.password);
    setEditName(user.name || "");
    setEditNotes(user.notes || "");
    setEditError("");
  };

  // Save Edit modal
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditError("");

    if (!editPassword.trim()) {
      setEditError(lang === "bn" ? "পাসওয়ার্ড ফাঁকা রাখা যাবে না।" : "Password cannot be empty.");
      return;
    }

    setIsUpdating(true);
    const result = await updateAdminUser(
      editingUser.id,
      {
        password: editPassword.trim(),
        name: editName.trim() || undefined,
        notes: editNotes.trim() || undefined,
      },
      ADMIN_PASSWORD
    );
    setIsUpdating(false);

    if (result.success && result.user) {
      setUsers((prev) => prev.map((u) => (u.id === editingUser.id ? result.user! : u)));
      const username = editingUser.username;
      setEditingUser(null);
      showToast(
        "success",
        lang === "bn"
          ? `ইউজার @${username} এর তথ্য আপডেট করা হয়েছে!`
          : `User @${username} updated successfully!`
      );
    } else {
      setEditError(result.error || (lang === "bn" ? "আপডেট করা যায়নি।" : "Failed to update."));
    }
  };

  // Copy User Login details
  const handleCopyCredentials = (user: ManagedUser) => {
    const text = `আইরিন টিভি লগইন বিবরণ:\nইউজারনেম: ${user.username}\nপাসওয়ার্ড: ${user.password}\nওয়েবসাইট: ${window.location.origin}`;
    navigator.clipboard.writeText(text);
    setCopiedId(user.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Toggle Password Visibility
  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Filtered Users
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.name && user.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.notes && user.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (filterStatus === "active") return !user.isLocked;
    if (filterStatus === "locked") return user.isLocked;
    return true;
  });

  const totalCount = users.length;
  const activeCount = users.filter((u) => !u.isLocked).length;
  const lockedCount = users.filter((u) => u.isLocked).length;

  return (
    <div
      id="admin-panel-overlay"
      className="fixed inset-0 z-50 bg-[#050505]/95 backdrop-blur-xl text-neutral-100 overflow-y-auto font-sans flex flex-col"
    >
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-20 bg-neutral-950/90 border-b border-neutral-800 px-4 sm:px-8 py-3.5 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition-all active:scale-95 flex items-center gap-1.5 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{lang === "bn" ? "টিভি চ্যানেলে ফিরুন" : "Back to TV"}</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-600 to-red-950 p-0.5 flex items-center justify-center shadow-md shadow-red-950/40">
              <div className="w-full h-full bg-[#0a0a0a] rounded-[10px] flex items-center justify-center">
                <Shield className="w-4 h-4 text-red-500" />
              </div>
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-black text-white tracking-tight flex items-center gap-2">
                <span>{lang === "bn" ? "এডমিন ইউজার কন্ট্রোল প্যানেল" : "Admin User Management"}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-600/20 text-red-400 border border-red-800/40 font-mono">
                  Master
                </span>
              </h1>
              <p className="text-[11px] text-neutral-400">
                {lang === "bn"
                  ? "ইউজার অ্যাকাউন্ট তৈরি ও লক/আনলক নিয়ন্ত্রণ"
                  : "Create user credentials & manage lock/unlock permissions"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadUsers}
            disabled={isLoading}
            title={lang === "bn" ? "রিফ্রেশ করুন" : "Refresh"}
            className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white transition-all active:scale-95"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-red-500" : ""}`} />
          </button>
          
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white transition-all active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-neutral-400 font-medium">
                {lang === "bn" ? "মোট ইউজার আইডি" : "Total Users"}
              </p>
              <h3 className="text-2xl font-black text-white font-mono mt-0.5">{totalCount}</h3>
            </div>
            <div className="w-11 h-11 rounded-xl bg-neutral-800/60 border border-neutral-700/50 flex items-center justify-center text-neutral-300">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-emerald-400/90 font-medium">
                {lang === "bn" ? "সক্রিয় / আনলক ইউজার" : "Active / Unlocked"}
              </p>
              <h3 className="text-2xl font-black text-emerald-400 font-mono mt-0.5">{activeCount}</h3>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-950/30 border border-emerald-800/40 flex items-center justify-center text-emerald-400">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-red-400/90 font-medium">
                {lang === "bn" ? "লক করা ইউজার (ব্লক)" : "Locked / Blocked"}
              </p>
              <h3 className="text-2xl font-black text-red-400 font-mono mt-0.5">{lockedCount}</h3>
            </div>
            <div className="w-11 h-11 rounded-xl bg-red-950/30 border border-red-800/40 flex items-center justify-center text-red-400">
              <UserX className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Layout Grid: Add User (Left) + Users List & Controls (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ADD USER CARD (4 Cols on lg) */}
          <div className="lg:col-span-4 bg-neutral-900/80 border border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col gap-4 sticky top-20">
            <div className="flex items-center gap-2 pb-3 border-b border-neutral-800">
              <div className="w-8 h-8 rounded-xl bg-red-600/20 text-red-500 flex items-center justify-center">
                <UserPlus className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-white">
                  {lang === "bn" ? "নতুন ইউজার তৈরি করুন" : "Add New User"}
                </h2>
                <p className="text-[11px] text-neutral-400">
                  {lang === "bn" ? "ইউজারনেম ও পাসওয়ার্ড দিয়ে আইডি বানান" : "Assign credentials for user access"}
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateUser} className="flex flex-col gap-3.5">
              {/* Username input */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  {lang === "bn" ? "ইউজারনেম (Username)" : "Username"} <span className="text-red-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-neutral-500 pointer-events-none">
                    <Users className="w-4 h-4" />
                  </span>
                  <input
                    id="new-user-username"
                    type="text"
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="e.g. user_rahim, anamul12"
                    className="w-full bg-[#050505] border border-neutral-800 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 text-xs sm:text-sm text-white placeholder-neutral-500 rounded-xl py-2.5 pl-9 pr-3 font-mono transition-all outline-none"
                  />
                </div>
              </div>

              {/* Password input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-neutral-300">
                    {lang === "bn" ? "পাসওয়ার্ড (Password)" : "Password"} <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="text-[11px] text-red-400 hover:text-red-300 font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>{lang === "bn" ? "অটো জেনারেট" : "Auto Gen"}</span>
                  </button>
                </div>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-neutral-500 pointer-events-none">
                    <Key className="w-4 h-4" />
                  </span>
                  <input
                    id="new-user-password"
                    type="text"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="e.g. pass1234"
                    className="w-full bg-[#050505] border border-neutral-800 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 text-xs sm:text-sm text-white placeholder-neutral-500 rounded-xl py-2.5 pl-9 pr-3 font-mono transition-all outline-none"
                  />
                </div>
              </div>

              {/* Full Name (optional) */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  {lang === "bn" ? "ইউজারের নাম / গ্রাহকের নাম (ঐচ্ছিক)" : "Customer / User Name (Optional)"}
                </label>
                <input
                  id="new-user-name"
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Rahim Ahmed"
                  className="w-full bg-[#050505] border border-neutral-800 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 text-xs sm:text-sm text-white placeholder-neutral-500 rounded-xl py-2.5 px-3 transition-all outline-none"
                />
              </div>

              {/* Notes / Plan (optional) */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  {lang === "bn" ? "নোট বা মন্তব্য (ঐচ্ছিক)" : "Notes / Info (Optional)"}
                </label>
                <input
                  id="new-user-notes"
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="e.g. 1 Month Access, VIP"
                  className="w-full bg-[#050505] border border-neutral-800 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 text-xs sm:text-sm text-white placeholder-neutral-500 rounded-xl py-2.5 px-3 transition-all outline-none"
                />
              </div>

              {/* Form Feedback */}
              {formError && (
                <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-800/60 text-red-400 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="p-2.5 rounded-xl bg-green-950/40 border border-green-800/60 text-green-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                id="btn-create-user"
                disabled={isCreating}
                className="w-full mt-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-red-950/50"
              >
                {isCreating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                <span>{lang === "bn" ? "ইউজার যোগ করুন" : "Add User Account"}</span>
              </button>
            </form>

            <div className="mt-2 p-3 rounded-2xl bg-neutral-950/60 border border-neutral-800/60 text-[11px] text-neutral-400 flex flex-col gap-1">
              <span className="font-semibold text-neutral-300">💡 নিয়মাবলী:</span>
              <span>• তৈরি করা ইউজারনেম ও পাসওয়ার্ড দিয়ে যেকেউ লগইন করতে পারবে।</span>
              <span>• আপনি চাইলে যেকোনো সময় যেকারো আইডি লক বা আনলক করতে পারবেন।</span>
            </div>
          </div>

          {/* USER LIST & MANAGEMENT (8 Cols on lg) */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            {/* Search & Filter Bar */}
            <div className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-lg">
              {/* Search box */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={lang === "bn" ? "ইউজার খুঁজুন..." : "Search users..."}
                  className="w-full bg-[#050505] border border-neutral-800 focus:border-red-600 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-neutral-500 outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Status Filter Chips */}
              <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
                <button
                  onClick={() => setFilterStatus("all")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                    filterStatus === "all"
                      ? "bg-neutral-200 text-neutral-900"
                      : "bg-neutral-800/80 text-neutral-400 hover:text-white"
                  }`}
                >
                  {lang === "bn" ? `সব (${totalCount})` : `All (${totalCount})`}
                </button>
                <button
                  onClick={() => setFilterStatus("active")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
                    filterStatus === "active"
                      ? "bg-emerald-600 text-white"
                      : "bg-neutral-800/80 text-neutral-400 hover:text-emerald-400"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>{lang === "bn" ? `সক্রিয় (${activeCount})` : `Active (${activeCount})`}</span>
                </button>
                <button
                  onClick={() => setFilterStatus("locked")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
                    filterStatus === "locked"
                      ? "bg-red-600 text-white"
                      : "bg-neutral-800/80 text-neutral-400 hover:text-red-400"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-red-400"></span>
                  <span>{lang === "bn" ? `লক করা (${lockedCount})` : `Locked (${lockedCount})`}</span>
                </button>
              </div>
            </div>

            {/* USERS LIST CONTAINER */}
            {isLoading ? (
              <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-12 flex flex-col items-center justify-center gap-3 text-neutral-400">
                <RefreshCw className="w-6 h-6 animate-spin text-red-500" />
                <p className="text-xs">{lang === "bn" ? "ইউজার তথ্য লোড হচ্ছে..." : "Loading users..."}</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-12 flex flex-col items-center justify-center gap-3 text-center">
                <div className="w-12 h-12 rounded-2xl bg-neutral-800 flex items-center justify-center text-neutral-500">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-300">
                    {lang === "bn" ? "কোন ইউজার পাওয়া যায়নি" : "No users found"}
                  </h3>
                  <p className="text-xs text-neutral-500 max-w-xs mt-1">
                    {searchQuery
                      ? "আপনার সার্চের সাথে কোনো ইউজার মিলছে না।"
                      : "নতুন ইউজার তৈরি করতে বাম পাশের ফর্মটি ব্যবহার করুন।"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredUsers.map((user) => {
                  const isPassVisible = !!visiblePasswords[user.id];
                  const isCopied = copiedId === user.id;

                  return (
                    <motion.div
                      layout
                      key={user.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`bg-neutral-900/80 border rounded-2xl p-4 sm:p-5 transition-all shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        user.isLocked
                          ? "border-red-900/50 bg-red-950/10"
                          : "border-neutral-800/90 hover:border-neutral-700"
                      }`}
                    >
                      {/* Left: User Details */}
                      <div className="flex items-start gap-3.5">
                        <div
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                            user.isLocked
                              ? "bg-red-950/40 border-red-800/60 text-red-400"
                              : "bg-emerald-950/40 border-emerald-800/60 text-emerald-400"
                          }`}
                        >
                          {user.isLocked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
                        </div>

                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm sm:text-base font-bold text-white font-mono">
                              {user.username}
                            </span>
                            
                            {/* Status Badge */}
                            {user.isLocked ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-950/80 text-red-400 border border-red-800/60 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                                {lang === "bn" ? "লক করা (অ্যাক্সেস বন্ধ)" : "Locked (Access Blocked)"}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                {lang === "bn" ? "সক্রিয় (আনলক)" : "Active (Unlocked)"}
                              </span>
                            )}
                          </div>

                          {user.name && (
                            <p className="text-xs text-neutral-300 font-medium">
                              👤 {user.name}
                            </p>
                          )}

                          {user.notes && (
                            <p className="text-[11px] text-neutral-400 italic">
                              📝 {user.notes}
                            </p>
                          )}

                          {/* Credentials Row */}
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center gap-1 bg-[#050505] px-2.5 py-1 rounded-lg border border-neutral-800 text-xs text-neutral-300 font-mono">
                              <span className="text-neutral-500 text-[11px]">পাসওয়ার্ড:</span>
                              <span className="font-bold text-white">
                                {isPassVisible ? user.password : "••••••••"}
                              </span>
                              <button
                                type="button"
                                onClick={() => togglePasswordVisibility(user.id)}
                                className="ml-1 p-0.5 text-neutral-500 hover:text-neutral-200"
                                title={isPassVisible ? "পাসওয়ার্ড লুকান" : "পাসওয়ার্ড দেখুন"}
                              >
                                {isPassVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>

                            {/* Copy button */}
                            <button
                              onClick={() => handleCopyCredentials(user)}
                              title={lang === "bn" ? "লগইন তথ্য কপি করুন" : "Copy credentials"}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1 transition-all active:scale-95 ${
                                isCopied
                                  ? "bg-green-600 text-white border-green-600"
                                  : "bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border-neutral-700"
                              }`}
                            >
                              {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                              <span>{isCopied ? (lang === "bn" ? "কপি হয়েছে!" : "Copied!") : (lang === "bn" ? "কপি" : "Copy")}</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Right: Quick Action Controls */}
                      <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-800/80">
                        {/* TOGGLE LOCK BUTTON */}
                        <button
                          onClick={() => handleToggleLock(user)}
                          id={`btn-toggle-lock-${user.id}`}
                          title={
                            user.isLocked
                              ? lang === "bn"
                                ? "আইডি আনলক করুন (চালু)"
                                : "Unlock this user"
                              : lang === "bn"
                              ? "আইডি লক করুন (বন্ধ)"
                              : "Lock this user"
                          }
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm ${
                            user.isLocked
                              ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/50"
                              : "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-950/50"
                          }`}
                        >
                          {user.isLocked ? (
                            <>
                              <Unlock className="w-3.5 h-3.5" />
                              <span>{lang === "bn" ? "আনলক করুন" : "Unlock User"}</span>
                            </>
                          ) : (
                            <>
                              <Lock className="w-3.5 h-3.5" />
                              <span>{lang === "bn" ? "লক করুন" : "Lock User"}</span>
                            </>
                          )}
                        </button>

                        {/* EDIT BUTTON */}
                        <button
                          onClick={() => handleOpenEdit(user)}
                          title={lang === "bn" ? "পাসওয়ার্ড বা তথ্য এডিট" : "Edit User"}
                          className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 hover:text-white transition-all active:scale-95"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {/* DELETE BUTTON */}
                        <button
                          onClick={() => handleRequestDelete(user)}
                          title={lang === "bn" ? "মুছে ফেলুন" : "Delete User"}
                          id={`btn-delete-user-${user.id}`}
                          className="p-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-800/50 text-red-400 hover:text-red-300 transition-all active:scale-95"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* FLOATING TOAST NOTIFICATION */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 right-6 z-[60] max-w-sm w-full p-4 rounded-2xl shadow-2xl border backdrop-blur-xl flex items-center gap-3 font-sans ${
              toast.type === "success"
                ? "bg-emerald-950/95 border-emerald-700 text-emerald-100 shadow-emerald-950/50"
                : toast.type === "error"
                ? "bg-red-950/95 border-red-700 text-red-100 shadow-red-950/50"
                : "bg-neutral-900/95 border-neutral-700 text-white"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : toast.type === "error" ? (
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            ) : (
              <Shield className="w-5 h-5 text-blue-400 shrink-0" />
            )}
            <div className="flex-1 text-xs font-semibold">{toast.message}</div>
            <button
              onClick={() => setToast(null)}
              className="p-1 rounded-lg text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* EDIT USER MODAL */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-red-600/20 text-red-500 flex items-center justify-center">
                    <Edit3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white">
                      {lang === "bn" ? "ইউজার তথ্য পরিবর্তন" : "Edit User Details"}
                    </h3>
                    <p className="text-xs text-neutral-400 font-mono">@{editingUser.username}</p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingUser(null)}
                  className="p-1 text-neutral-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {editError && (
                <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-xs text-red-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{editError}</span>
                </div>
              )}

              <form onSubmit={handleSaveEdit} className="flex flex-col gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    {lang === "bn" ? "নতুন পাসওয়ার্ড" : "Password"} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    className="w-full bg-[#050505] border border-neutral-800 focus:border-red-600 rounded-xl py-2.5 px-3 text-xs sm:text-sm text-white font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    {lang === "bn" ? "ইউজারের নাম (Name)" : "Full Name"}
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-[#050505] border border-neutral-800 focus:border-red-600 rounded-xl py-2.5 px-3 text-xs sm:text-sm text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    {lang === "bn" ? "নোট / মেয়াদ বিবরণ" : "Notes / Remarks"}
                  </label>
                  <input
                    type="text"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="w-full bg-[#050505] border border-neutral-800 focus:border-red-600 rounded-xl py-2.5 px-3 text-xs sm:text-sm text-white outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 mt-2 pt-3 border-t border-neutral-800">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold"
                  >
                    {lang === "bn" ? "বাতিল" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1.5"
                  >
                    {isUpdating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    <span>{lang === "bn" ? "সংরক্ষণ করুন" : "Save Changes"}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE USER CONFIRMATION MODAL */}
      <AnimatePresence>
        {userToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              className="bg-neutral-900 border border-red-900/60 rounded-3xl p-6 max-w-md w-full shadow-2xl shadow-red-950/40 flex flex-col gap-4"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-red-950 border border-red-800/80 text-red-400 flex items-center justify-center">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {lang === "bn" ? "ইউজার আইডি ডিলিট" : "Delete User Account"}
                    </h3>
                    <p className="text-xs text-neutral-400">
                      {lang === "bn" ? "স্থায়ীভাবে মুছে ফেলার নিশ্চয়তা" : "Permanent removal confirmation"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => !isDeleting && setUserToDelete(null)}
                  disabled={isDeleting}
                  className="p-1 text-neutral-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Target User Info Card */}
              <div className="bg-[#050505] p-4 rounded-2xl border border-neutral-800 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-400 font-medium">ইউজারনেম:</span>
                  <span className="text-sm font-bold font-mono text-red-400">@{userToDelete.username}</span>
                </div>
                {userToDelete.name && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-neutral-400 font-medium">নাম:</span>
                    <span className="text-xs font-semibold text-white">{userToDelete.name}</span>
                  </div>
                )}
                {userToDelete.notes && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-neutral-400 font-medium">নোট:</span>
                    <span className="text-xs text-neutral-300 italic">{userToDelete.notes}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-400 font-medium">পাসওয়ার্ড:</span>
                  <span className="text-xs font-mono text-neutral-300">{userToDelete.password}</span>
                </div>
              </div>

              {/* Warning box */}
              <div className="p-3.5 bg-red-950/40 border border-red-900/60 rounded-2xl flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs text-red-200 leading-relaxed">
                  {lang === "bn"
                    ? "আপনি কি নিশ্চিত যে এই ইউজারটি স্থায়ীভাবে মুছে ফেলতে চান? ডিলিট করলে এই অ্যাকাউন্ট দিয়ে আর কোনোভাবেই ওয়েবসাইটে লগইন করা যাবে না।"
                    : "Are you sure you want to permanently delete this user? Once deleted, this account will no longer be able to log in to the website."}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setUserToDelete(null)}
                  className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold transition-all"
                >
                  {lang === "bn" ? "না, বাতিল" : "Cancel"}
                </button>
                <button
                  type="button"
                  id="btn-confirm-delete-user"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg shadow-red-950/60 active:scale-95"
                >
                  {isDeleting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{lang === "bn" ? "ডিলিট হচ্ছে..." : "Deleting..."}</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>{lang === "bn" ? "হ্যাঁ, ডিলিট করুন" : "Yes, Delete User"}</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
