"use client";

import { useState, useEffect, useRef } from "react";
import { Users, Palette, FileText, Plug, Gauge, CheckCircle, Loader2, Lightbulb, ArrowRight, Sparkles, Target, TrendingUp, Eye } from "lucide-react";

interface Expert {
  id: string;
  name: string;
  role: string;
  specialty: string;
  icon: any;
  color: string;
  bgColor: string;
}

interface ReviewFinding {
  id: string;
  category: string;
  severity: string;
  title: string;
  description: string;
  recommendation: string;
  effort: string;
  impact: string;
}

interface FinalRecommendation {
  quickWins: ReviewFinding[];
  strategicImprovements: ReviewFinding[];
  longTermVision: string[];
  estimatedImpact: string;
}

const experts = [
  { id: "ui-expert", name: "Maya", role: "UI/UX Lead", specialty: "Visual hierarchy, usability, design systems", icon: Palette, color: "text-purple-400", bgColor: "bg-purple-500/10" },
  { id: "content-expert", name: "Oliver", role: "Content Strategist", specialty: "Information architecture, copy, clarity", icon: FileText, color: "text-blue-400", bgColor: "bg-blue-500/10" },
  { id: "integration-expert", name: "Nina", role: "Integration Specialist", specialty: "APIs, data sources, automation", icon: Plug, color: "text-emerald-400", bgColor: "bg-emerald-500/10" },
  { id: "performance-expert", name: "Paul", role: "Performance QA Lead", specialty: "Speed, stability, testing, monitoring", icon: Gauge, color: "text-amber-400", bgColor: "bg-amber-500/10" }
];

export default function ExpertReviewTeam() {
  const [phase, setPhase] = useState("idle");
  const [isProcessing, setIsProcessing] = useState(false);
  const [finalRecommendation, setFinalRecommendation] = useState(null as FinalRecommendation | null);

  const startReview = async () => {
    setPhase("discussing");
    setIsProcessing(true);
    await delay(2000);
    setPhase("reviewing");
    await delay(2000);
    
    setFinalRecommendation({
      quickWins: [
        { id: "1", category: "ui", severity: "improvement", title: "Add loading skeletons", description: "Charts show empty space while loading", recommendation: "Add animated skeleton loaders", effort: "low", impact: "medium" },
        { id: "2", category: "content", severity: "improvement", title: "Explain commodity symbols", description: "BRENT, ALUM are not clear to users", recommendation: "Add tooltips with full names", effort: "low", impact: "high" },
        { id: "3", category: "integration", severity: "critical", title: "Add API fallback", description: "No error handling when Yahoo fails", recommendation: "Show cached data with timestamp", effort: "medium", impact: "high" }
      ],
      strategicImprovements: [
        { id: "4", category: "ui", severity: "critical", title: "Mobile chart optimization", description: "Charts hard to use on mobile", recommendation: "Pinch-to-zoom, better touch targets", effort: "high", impact: "high" },
        { id: "5", category: "performance", severity: "improvement", title: "Data downsampling", description: "Loading 8760 data points is overkill", recommendation: "Daily data for 1y view, hourly for 1d", effort: "medium", impact: "high" },
        { id: "6", category: "integration", severity: "improvement", title: "Real NOK source", description: "NOK uses mock data", recommendation: "Integrate Norges Bank API", effort: "medium", impact: "high" }
      ],
      longTermVision: [
        "Personalized watchlists",
        "Price alerts and notifications",
        "Portfolio tracking with broker APIs",
        "AI-powered trend analysis",
        "Native mobile apps"
      ],
      estimatedImpact: "Quick wins improve satisfaction by 40%. Full implementation creates professional-grade dashboard."
    });
    
    setPhase("presenting");
    setIsProcessing(false);
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const handleApprove = () => setPhase("approved");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white flex items-center gap-3">
            <Users className="w-6 h-6 text-[#5b8aff]" />
            Expert Review Team
          </h1>
          <p className="text-[#8a8a9a] mt-1">
            {phase === "idle" && "Ready to analyze your dashboard"}
            {phase === "discussing" && "Experts are discussing..."}
            {phase === "reviewing" && "Compiling reviews..."}
            {phase === "presenting" && "Review complete"}
            {phase === "approved" && "Implementation approved"}
          </p>
        </div>

        {phase === "idle" ? (
          <button onClick={startReview} disabled={isProcessing} className="px-6 py-3 bg-[#5b8aff] text-white rounded-xl font-medium hover:bg-[#5b8aff]/90 transition-colors flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Start Expert Review
          </button>
        ) : phase === "presenting" ? (
          <button onClick={handleApprove} className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-500/90 transition-colors flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Approve Implementation
          </button>
        ) : (
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
            <span className="text-amber-400">Analyzing...</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {experts.map((expert) => {
          const Icon = expert.icon;
          return (
            <div key={expert.id} className="p-4 rounded-xl bg-[#13131f] border border-white/[0.06]">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-white/[0.04] flex items-center justify-center">
                  <Icon className="w-5 h-5 text-[#8a8a9a]" />
                </div>
                <div>
                  <p className="font-medium text-white">{expert.name}</p>
                  <p className="text-xs text-[#5a5a6a]">{expert.role}</p>
                </div>
              </div>
              <p className="text-xs text-[#8a8a9a]">{expert.specialty}</p>
            </div>
          );
        })}
      </div>

      {finalRecommendation && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-[#5b8aff]/10 to-purple-500/10 rounded-xl border border-[#5b8aff]/20 p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#5b8aff]/20 flex items-center justify-center">
                <Target className="w-6 h-6 text-[#5b8aff]" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">Executive Summary</h3>
                <p className="text-[#f0f0f5] mb-4">{finalRecommendation.estimatedImpact}</p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-sm">{finalRecommendation.quickWins.length} Quick Wins</span>
                  <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-sm">{finalRecommendation.strategicImprovements.length} Strategic Items</span>
                  <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-sm">{finalRecommendation.longTermVision.length} Future Ideas</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#13131f] rounded-xl border border-white/[0.06] p-4">
            <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-emerald-400" />
              Quick Wins - Do These First
            </h3>
            <div className="space-y-3">
              {finalRecommendation.quickWins.map((finding) => (
                <div key={finding.id} className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-white">{finding.title}</h4>
                    <span className="text-xs text-amber-400">{finding.effort} effort</span>
                  </div>
                  <p className="text-sm text-[#8a8a9a] mb-2">{finding.description}</p>
                  <div className="flex items-center gap-2 text-sm">
                    <ArrowRight className="w-4 h-4 text-[#5b8aff]" />
                    <span className="text-[#f0f0f5]">{finding.recommendation}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#13131f] rounded-xl border border-white/[0.06] p-4">
            <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              Strategic Improvements
            </h3>
            <div className="space-y-3">
              {finalRecommendation.strategicImprovements.map((finding) => (
                <div key={finding.id} className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-white">{finding.title}</h4>
                    <span className="text-xs text-amber-400">{finding.effort} effort</span>
                  </div>
                  <p className="text-sm text-[#8a8a9a] mb-2">{finding.description}</p>
                  <div className="flex items-center gap-2 text-sm">
                    <ArrowRight className="w-4 h-4 text-[#5b8aff]" />
                    <span className="text-[#f0f0f5]">{finding.recommendation}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#13131f] rounded-xl border border-white/[0.06] p-4">
            <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              Long-Term Vision
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {finalRecommendation.longTermVision.map((idea, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-medium">{idx + 1}</span>
                  <span className="text-[#f0f0f5]">{idea}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
