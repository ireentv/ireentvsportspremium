import React, { useState } from "react";
import { 
  X, Sparkles, Check, Flame, Crown, Zap, Tv, Film, Music, Compass, 
  ShieldCheck, Smartphone, Monitor, Globe, Clock, MessageSquare, 
  ExternalLink, Copy, CheckCircle2, Award, Star, ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface VipPackagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: "bn" | "en";
}

interface PackageTier {
  id: string;
  nameBn: string;
  nameEn: string;
  durationBn: string;
  durationEn: string;
  price: number;
  originalPrice?: number;
  badgeBn?: string;
  badgeEn?: string;
  isPopular?: boolean;
  isBestValue?: boolean;
  accentColor: string;
  bgGradient: string;
  borderGradient: string;
  featuresBn: string[];
  featuresEn: string[];
}

const PACKAGES: PackageTier[] = [
  {
    id: "7_days",
    nameBn: "৭ দিন ট্রায়াল প্যাক",
    nameEn: "7 Days Trial Pack",
    durationBn: "৭ দিন ভ্যালিডিটি",
    durationEn: "7 Days Validity",
    price: 50,
    originalPrice: 70,
    accentColor: "text-blue-400",
    bgGradient: "from-blue-950/40 via-neutral-900 to-[#0a0a0a]",
    borderGradient: "border-blue-700/40 hover:border-blue-500",
    featuresBn: [
      "সকল স্পোর্টস ও মুভি চ্যানেল",
      "1080p ফুল এইচডি স্ট্রিমিং",
      "১টি ডিভাইসে ব্যবহার",
      "ইনস্ট্যান্ট আইডি এক্টিভেশন"
    ],
    featuresEn: [
      "All Sports & Movie Channels",
      "1080p Full HD Streaming",
      "1 Device Access",
      "Instant ID Activation"
    ]
  },
  {
    id: "15_days",
    nameBn: "১৫ দিন স্ট্যান্ডার্ড প্যাক",
    nameEn: "15 Days Standard Pack",
    durationBn: "১৫ দিন ভ্যালিডিটি",
    durationEn: "15 Days Validity",
    price: 80,
    originalPrice: 120,
    accentColor: "text-emerald-400",
    bgGradient: "from-emerald-950/40 via-neutral-900 to-[#0a0a0a]",
    borderGradient: "border-emerald-700/40 hover:border-emerald-500",
    featuresBn: [
      "ফুল এইচডি ও আল্ট্রা ফাস্ট বাফারিং-ফ্রি",
      "লাইভ ক্রিকেট, ফুটবল ও সিনেমা",
      "স্মার্ট টিভি ও মোবাইল সাপোর্ট",
      "২৪/৭ এডমিন সাপোর্ট"
    ],
    featuresEn: [
      "Full HD & Ultra Fast Buffer-Free",
      "Live Cricket, Football & Cinema",
      "Smart TV & Mobile Support",
      "24/7 Admin Support"
    ]
  },
  {
    id: "1_month",
    nameBn: "১ মাস প্রিমিয়াম প্যাক",
    nameEn: "1 Month Premium Pack",
    durationBn: "৩০ দিন ভ্যালিডিটি",
    durationEn: "30 Days Validity",
    price: 150,
    originalPrice: 200,
    badgeBn: "🔥 সর্বাধিক জনপ্রিয়",
    badgeEn: "🔥 Most Popular",
    isPopular: true,
    accentColor: "text-amber-400",
    bgGradient: "from-amber-950/50 via-neutral-900 to-[#0a0a0a]",
    borderGradient: "border-amber-500/80 shadow-amber-950/60",
    featuresBn: [
      "ওয়ার্ল্ড-ওয়াইড সকল ডিমান্ডিং চ্যানেল",
      "ক্রিকেট (IPL, ICC, BPL) ও ফুটবল (EPL, UCL)",
      "ফুল এইচডি 1080p প্রিমিয়াম সার্ভার",
      "মোবাইল, পিসি ও স্মার্ট টিভিতে এক্টিভেশন",
      "ভিআইপি ডেডিকেটেড হাই-স্পিড লাইন"
    ],
    featuresEn: [
      "All Worldwide Demanded Channels",
      "Cricket (IPL, ICC, BPL) & Football (EPL, UCL)",
      "Full HD 1080p Premium Fast Server",
      "Mobile, PC & Smart TV Support",
      "VIP Dedicated High-Speed Line"
    ]
  },
  {
    id: "3_month",
    nameBn: "৩ মাস মেগা সেভার প্যাক",
    nameEn: "3 Months Mega Saver Pack",
    durationBn: "৯০ দিন ভ্যালিডিটি",
    durationEn: "90 Days Validity",
    price: 300,
    originalPrice: 450,
    badgeBn: "💎 সেরা সাশ্রয়ী (Mega Saver)",
    badgeEn: "💎 Mega Saver (50% Off)",
    isBestValue: true,
    accentColor: "text-purple-400",
    bgGradient: "from-purple-950/50 via-neutral-900 to-[#0a0a0a]",
    borderGradient: "border-purple-500/80 shadow-purple-950/60",
    featuresBn: [
      "সর্বোচ্চ সাশ্রয় (মাত্র ১০০৳/মাস)",
      "আনলিমিটেড স্পোর্টস, মুভি ও ৪কে কনটেন্ট",
      "জিরো বাফারিং প্রিমিয়াম ক্লাউড সার্ভার",
      "মাল্টি-ডিভাইস সাপোর্ট ও অগ্রাধিকার সাপোর্ট",
      "সম্পূর্ণ ৩ মাস নিরবচ্ছিন্ন বিনোদন"
    ],
    featuresEn: [
      "Maximum Savings (Only 100৳/mo)",
      "Unlimited Sports, Movies & 4K Content",
      "Zero Buffering Premium Cloud Server",
      "Multi-Device Support & Priority Assistance",
      "Full 3 Months Seamless Entertainment"
    ]
  }
];

export default function VipPackagesModal({ isOpen, onClose, lang = "bn" }: VipPackagesModalProps) {
  const [selectedPackage, setSelectedPackage] = useState<string>("1_month");
  const [copiedText, setCopiedText] = useState(false);

  if (!isOpen) return null;

  const currentPkg = PACKAGES.find((p) => p.id === selectedPackage) || PACKAGES[2];

  const handleCopyOrderText = () => {
    const text = `হাই এডমিন, আমি IreenTV এর VIP প্যাকেজ কিনতে চাই।\nপ্যাকেজ: ${currentPkg.nameBn} (${currentPkg.durationBn})\nমূল্য: ${currentPkg.price}৳\nঅনুগ্রহ করে পেমেন্ট ডিটেইলস ও ইউজার আইডি প্রদান করুন।`;
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="relative w-full max-w-4xl bg-neutral-950 border border-neutral-800 rounded-3xl shadow-2xl shadow-black overflow-hidden flex flex-col my-auto max-h-[92vh]"
      >
        {/* Top Glow Ambient */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-gradient-to-b from-red-600/20 via-amber-500/10 to-transparent blur-2xl pointer-events-none" />

        {/* Modal Header */}
        <div className="relative z-10 px-5 sm:px-8 pt-6 pb-4 border-b border-neutral-800/80 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 via-red-600 to-purple-600 p-0.5 shadow-lg shadow-amber-950/40 shrink-0 flex items-center justify-center">
              <div className="w-full h-full bg-neutral-950 rounded-[14px] flex items-center justify-center">
                <Crown className="w-6 h-6 text-amber-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-black uppercase tracking-wider font-mono flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  VIP SUBSCRIPTION
                </span>
                <span className="px-2 py-0.5 rounded-full bg-red-600/10 border border-red-600/30 text-red-400 text-[10px] font-bold">
                  100% BUFFER-FREE
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
                {lang === "bn" ? "IreenTV প্রিমিয়াম ভিআইপি প্যাকেজ" : "IreenTV Premium VIP Packages"}
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                {lang === "bn"
                  ? "হাই ডিমান্ড স্পোর্টস, ব্লকবাস্টার মুভি, মিউজিক ও ফুল এইচডি লাইভ টিভি"
                  : "High Demand Live Sports, Movies, Music & Full HD Streaming Channels"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white transition-all active:scale-95 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-8 overflow-y-auto space-y-6">
          {/* PRICING TIERS GRID (4 Packages) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-neutral-300 flex items-center gap-2 font-mono">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>{lang === "bn" ? "প্যাকেজ নির্বাচন করুন" : "Select Your Package"}</span>
              </h3>
              <span className="text-xs text-neutral-500 font-medium">
                {lang === "bn" ? "বিকাশ / নগদ / রকেটে ইনস্ট্যান্ট এক্টিভেশন" : "bKash / Nagad / Rocket Payment"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {PACKAGES.map((pkg) => {
                const isSelected = selectedPackage === pkg.id;
                return (
                  <div
                    key={pkg.id}
                    onClick={() => setSelectedPackage(pkg.id)}
                    className={`relative rounded-3xl p-4 sm:p-5 cursor-pointer transition-all duration-200 border flex flex-col justify-between bg-gradient-to-b ${pkg.bgGradient} ${
                      isSelected
                        ? `${pkg.borderGradient} ring-2 ring-amber-400/40 shadow-xl scale-[1.02]`
                        : "border-neutral-800/80 hover:border-neutral-700 hover:scale-[1.01]"
                    }`}
                  >
                    {/* Floating Badge for popular or best value */}
                    {(pkg.badgeBn || pkg.badgeEn) && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-red-600 text-neutral-950 font-black text-[10px] shadow-lg shadow-amber-950/60 uppercase tracking-wide flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>{lang === "bn" ? pkg.badgeBn : pkg.badgeEn}</span>
                      </div>
                    )}

                    <div>
                      {/* Package Duration Header */}
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <span className="text-xs font-bold text-neutral-300">
                          {lang === "bn" ? pkg.nameBn : pkg.nameEn}
                        </span>
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                            isSelected
                              ? "bg-amber-400 border-amber-300 text-neutral-950"
                              : "border-neutral-700 bg-neutral-900"
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>

                      {/* Price Section */}
                      <div className="my-2 flex items-baseline gap-1.5">
                        <span className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight">
                          ৳{pkg.price}
                        </span>
                        {pkg.originalPrice && (
                          <span className="text-xs text-neutral-500 line-through font-mono">
                            ৳{pkg.originalPrice}
                          </span>
                        )}
                        <span className="text-[11px] text-neutral-400 font-medium">
                          / {lang === "bn" ? pkg.durationBn : pkg.durationEn}
                        </span>
                      </div>

                      {/* Features list */}
                      <ul className="space-y-1.5 mt-3 pt-3 border-t border-neutral-800/80 text-[11px] text-neutral-300">
                        {(lang === "bn" ? pkg.featuresBn : pkg.featuresEn).map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            <span className="leading-tight">{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-4 pt-3">
                      <button
                        type="button"
                        className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          isSelected
                            ? "bg-gradient-to-r from-red-600 to-amber-500 text-white shadow-md shadow-red-950/60"
                            : "bg-neutral-800/80 text-neutral-300 hover:bg-neutral-800"
                        }`}
                      >
                        <span>{isSelected ? (lang === "bn" ? "নির্বাচিত" : "Selected") : (lang === "bn" ? "পছন্দ করুন" : "Choose")}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* DETAILED CHANNEL & SERVICE HIGHLIGHTS */}
          <div className="bg-[#050505] p-5 sm:p-6 rounded-3xl border border-neutral-800/90 space-y-5">
            <div className="flex items-center gap-2 border-b border-neutral-800/80 pb-3">
              <Award className="w-5 h-5 text-red-500" />
              <h4 className="text-sm sm:text-base font-black text-white">
                {lang === "bn" ? "ভিআইপি প্যাকেজের বিশেষ সুবিধাসমূহ" : "VIP Package Exclusive Features"}
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              {/* Category 1: World Wide Live Sports */}
              <div className="p-3.5 rounded-2xl bg-neutral-905 bg-neutral-900/60 border border-neutral-800 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-red-400 font-bold">
                  <div className="p-1.5 rounded-xl bg-red-950/80 border border-red-800/50">
                    <Tv className="w-4 h-4 text-red-400" />
                  </div>
                  <span>{lang === "bn" ? "ওয়ার্ল্ড-ওয়াইড হাই ডিমান্ড স্পোর্টস" : "Worldwide Live Sports"}</span>
                </div>
                <p className="text-neutral-400 text-[11px] leading-relaxed">
                  {lang === "bn"
                    ? "লাইভ ক্রিকেট (IPL, BPL, ICC World Cup, Asia Cup, Test & ODI) এবং ফুটবল (UEFA Champions League, EPL, La Liga, Serie A)। Star Sports, Sony Sports, T Sports, Astro, Willow TV সম্পূর্ণ বাফারিং-মুক্ত।"
                    : "Live Cricket (IPL, BPL, ICC, Asia Cup) & Football (UCL, EPL, La Liga). Star Sports, Sony, T Sports, Astro, Willow TV crystal clear."}
                </p>
              </div>

              {/* Category 2: Movies & Entertainment */}
              <div className="p-3.5 rounded-2xl bg-neutral-900/60 border border-neutral-800 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <div className="p-1.5 rounded-xl bg-amber-950/80 border border-amber-800/50">
                    <Film className="w-4 h-4 text-amber-400" />
                  </div>
                  <span>{lang === "bn" ? "ব্লকবাস্টার মুভি ও ড্রামা চ্যানেল" : "Movies & Drama Channels"}</span>
                </div>
                <p className="text-neutral-400 text-[11px] leading-relaxed">
                  {lang === "bn"
                    ? "বাংলা, হিন্দি ও হলিউড সিনেমা। Zee Cinema, Star Gold, HBO, Sony Max, Zee Bangla, Colors Bangla সহ দেশি-বিদেশি জনপ্রিয় চ্যানেলসমূহ 1080p ফুল এইচডি রেজুলেশনে।"
                    : "Bangla, Hindi & Hollywood blockbusters. Zee Cinema, Star Gold, HBO, Sony Max, Zee Bangla, Colors HD with crystal clear quality."}
                </p>
              </div>

              {/* Category 3: Music & Documentaries */}
              <div className="p-3.5 rounded-2xl bg-neutral-900/60 border border-neutral-800 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-blue-400 font-bold">
                  <div className="p-1.5 rounded-xl bg-blue-950/80 border border-blue-800/50">
                    <Music className="w-4 h-4 text-blue-400" />
                  </div>
                  <span>{lang === "bn" ? "মিউজিক ও ডিসকভারি ডকুমেন্টারি" : "Music & Discovery"}</span>
                </div>
                <p className="text-neutral-400 text-[11px] leading-relaxed">
                  {lang === "bn"
                    ? "24/7 নন-স্টপ মিউজিক চ্যানেল (9XM, MTV, Sangeet Bangla) এবং বিশ্বমানের তথ্যভিত্তিক চ্যানেল যেমন Discovery HD, Nat Geo, History TV18 ও Animal Planet।"
                    : "24/7 Music channels (9XM, MTV, Sangeet Bangla) and Discovery HD, Nat Geo, History TV18, Animal Planet."}
                </p>
              </div>

              {/* Feature 4: Server Quality */}
              <div className="p-3.5 rounded-2xl bg-neutral-900/60 border border-neutral-800 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <div className="p-1.5 rounded-xl bg-emerald-950/80 border border-emerald-800/50">
                    <Zap className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span>{lang === "bn" ? "আল্ট্রা হাই-স্পিড লো ল্যাটেন্সি" : "Ultra High Speed & Low Latency"}</span>
                </div>
                <p className="text-neutral-400 text-[11px] leading-relaxed">
                  {lang === "bn"
                    ? "স্মুথ প্লেব্যাক টেকনোলজি ও প্রিমিয়াম প্রক্সি সার্ভার, যা ধীরগতির ইন্টারনেটেও বাফারিং ছাড়াই নিরবচ্ছিন্ন স্ট্রিমিং নিশ্চিত করে।"
                    : "Smooth playback technology & premium proxy cloud server ensuring zero buffering even on slower internet."}
                </p>
              </div>

              {/* Feature 5: Multi-Device */}
              <div className="p-3.5 rounded-2xl bg-neutral-900/60 border border-neutral-800 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-purple-400 font-bold">
                  <div className="p-1.5 rounded-xl bg-purple-950/80 border border-purple-800/50">
                    <Smartphone className="w-4 h-4 text-purple-400" />
                  </div>
                  <span>{lang === "bn" ? "সকল ডিভাইসে সাপোর্ট" : "All Device Compatible"}</span>
                </div>
                <p className="text-neutral-400 text-[11px] leading-relaxed">
                  {lang === "bn"
                    ? "অ্যান্ড্রয়েড স্মার্টফোন, আইফোন, ল্যাপটপ/পিসি, আইপ্যাড, অ্যান্ড্রয়েড টিভি বক্স ও স্মার্ট টিভিতে কোনো জটিলতা ছাড়াই ব্যবহারযোগ্য।"
                    : "Seamless support across Android phones, iPhone, PC/Laptop, iPad, Android TV boxes & Smart TVs."}
                </p>
              </div>

              {/* Feature 6: Instant Support */}
              <div className="p-3.5 rounded-2xl bg-neutral-900/60 border border-neutral-800 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-pink-400 font-bold">
                  <div className="p-1.5 rounded-xl bg-pink-950/80 border border-pink-800/50">
                    <ShieldCheck className="w-4 h-4 text-pink-400" />
                  </div>
                  <span>{lang === "bn" ? "ইনস্ট্যান্ট অ্যাক্টিভেশন ও সাপোর্ট" : "Instant Activation & 24/7 Help"}</span>
                </div>
                <p className="text-neutral-400 text-[11px] leading-relaxed">
                  {lang === "bn"
                    ? "বিকাশ বা নগদে পেমেন্ট করার পর ৫ মিনিটের মধ্যে ইউজার আইডি ও পাসওয়ার্ড তৈরি করে দেওয়া হয়। যেকোনো সমস্যায় সরাসরি এডমিন হেল্প।"
                    : "User ID & password delivered within 5 mins after payment via bKash/Nagad. Dedicated admin help."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="relative z-10 p-5 sm:p-6 bg-neutral-900/90 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="p-2 rounded-xl bg-red-950/60 border border-red-800/60 text-red-400 shrink-0">
              <Crown className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="text-xs text-neutral-400">
                {lang === "bn" ? "নির্বাচিত প্যাকেজ:" : "Selected Package:"}
              </div>
              <div className="text-sm font-black text-white font-mono flex items-center gap-2">
                <span>{lang === "bn" ? currentPkg.nameBn : currentPkg.nameEn}</span>
                <span className="text-amber-400 text-base">৳{currentPkg.price}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end flex-wrap">
            {/* Copy order text button */}
            <button
              type="button"
              id="copy-vip-order-btn"
              onClick={handleCopyOrderText}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95"
            >
              {copiedText ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">{lang === "bn" ? "কপি হয়েছে!" : "Copied!"}</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>{lang === "bn" ? "অর্ডার টেক্সট কপি" : "Copy Order Text"}</span>
                </>
              )}
            </button>

            {/* Direct Admin Contact Button */}
            <a
              id="buy-vip-admin-direct-link"
              href="https://anamul.pages.dev/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-red-500 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white text-xs font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-950/60 active:scale-95"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{lang === "bn" ? "এডমিনের সাথে যোগাযোগ ও কিনুন" : "Contact Admin & Buy"}</span>
              <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
