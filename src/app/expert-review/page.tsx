"use client";

import { useState, useEffect } from "react";
import { Users, Palette, FileText, Plug, Gauge, CheckCircle, Loader2, Lightbulb, ArrowRight, Sparkles, Target, TrendingUp, GitBranch, Rocket, ExternalLink } from "lucide-react";

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

interface ImplementationStatus {
  id: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  progress: number;
  message: string;
  prUrl?: string;
  deployUrl?: string;
}

const experts = [
  { id: "ui-expert", name: "Maya", role: "UI/UX Lead", specialty: "Visual hierarchy, usability", icon: Palette },
  { id: "content-expert", name: "Oliver", role: "Content Strategist", specialty: "Information architecture", icon: FileText },
  { id: "integration-expert", name: "Nina", role: "Integration Specialist", specialty: "APIs, data sources", icon: Plug },
  { id: "performance-expert", name: "Paul", role: "Performance QA", specialty: "Speed, stability", icon: Gauge }
];

export default function ExpertReviewTeam() {
  const [phase, setPhase] = useState("idle");
  const [isProcessing, setIsProcessing] = useState(false);
  const [finalRecommendation, setFinalRecommendation] = useState(null as FinalRecommendation | null);
  const [implementation, setImplementation] = useState(null as ImplementationStatus | null);
  const [selectedFinding, setSelectedFinding] = useState(null as ReviewFinding | null);

  const startReview = async () => {
    setPhase("discussing");
    setIsProcessing(true);
    await delay(2000);
    setPhase("reviewing");
    await delay(2000);
    
    setFinalRecommendation({
      quickWins: [
        { id: "ui-1", category: "ui", severity: "improvement", title: "Add loading skeletons", description: "Charts show empty space while loading", recommendation: "Add animated skeleton loaders", effort: "low", impact: "medium" },
        { id: "content-1", category: "content", severity: "improvement", title: "Explain commodity symbols", description: "BRENT, ALUM are not clear to users", recommendation: "Add tooltips with full names", effort: "low", impact: "high" },
        { id: "int-1", category: "integration", severity: "critical", title: "Add API fallback", description: "No error handling when Yahoo fails", recommendation: "Show cached data with timestamp", effort: "medium", impact: "high" }
      ],
      strategicImprovements: [
        { id: "ui-3", category: "ui", severity: "critical", title: "Mobile chart optimization", description: "Charts hard to use on mobile", recommendation: "Pinch-to-zoom, better touch targets", effort: "high", impact: "high" },
        { id: "perf-1", category: "performance", severity: "improvement", title: "Data downsampling", description: "Loading 8760 data points is overkill", recommendation: "Daily data for 1y view", effort: "medium", impact: "high" },
        { id: "int-2", category: "integration", severity: "improvement", title: "Real NOK source", description: "NOK uses mock data", recommendation: "Integrate Norges Bank API", effort: "medium", impact: "high" }
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

  const implementFinding = async (finding: ReviewFinding) => {
    setSelectedFinding(finding);
    setImplementation({ id: "", status: "in_progress", progress: 0, message: "Starting implementation..." });
    
    try {
      const response = await fetch("/api/implement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recommendationId: finding.id,
          recommendation: finding,
          autoMerge: true
        }),
      });
      
      if (!response.ok) throw new Error("Failed to start implementation");
      
      const data = await response.json();
      
      // Poll for status
      pollImplementationStatus(data.id);
    } catch (error) {
      setImplementation({
        id: "",
        status: "failed",
        progress: 0,
        message: error instanceof Error ? error.message : "Implementation failed"
      });
    }
  };

  const pollImplementationStatus = async (id: string) => {
    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/implement?id=${id}`);
        if (!response.ok) throw new Error("Failed to get status");
        
        const status = await response.json();
        setImplementation(status);
        
        if (status.status === "in_progress") {
          setTimeout(checkStatus, 1000);
        }
      } catch (error) {
        console.error("Status check failed:", error);
      }
    };
    
    checkStatus();
  };

  const implementAll = async () => {
    if (!finalRecommendation) return;
    
    // Implement all quick wins
    for (const finding of finalRecommendation.quickWins) {
      await implementFinding(finding);
      await delay(5000); // Wait between implementations
    }
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
            {phase === "presenting" && "Review complete - click items to implement"}
            {phase === "approved" && "Implementation approved"}
          </p>
        </div>

        {phase === "idle" ? (
          <button onClick={startReview} disabled={isProcessing} className="px-6 py-3 bg-[#5b8aff] text-white rounded-xl font-medium hover:bg-[#5b8aff]/90 transition-colors flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Start Expert Review
          </button>
        ) : phase === "presenting" ? (
          <button onClick={implementAll} className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-500/90 transition-colors flex items-center gap-2">
            <Rocket className="w-4 h-4" />
            Implement All Quick Wins
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
              Quick Wins - Click to Implement
            </h3>
            
            <div className="space-y-3">
              {finalRecommendation.quickWins.map((finding) => (
                <div key={finding.id} className="group">
                  <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:border-[#5b8aff]/30 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-white">{finding.title}</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-emerald-400">{finding.effort} effort</span>
                        <button 
                          onClick={() => implementFinding(finding)}
                          disabled={implementation?.status === "in_progress"}
                          className="px-3 py-1 bg-[#5b8aff] text-white text-xs rounded-lg hover:bg-[#5b8aff]/90 transition-colors flex items-center gap-1"
                        >
                          <Rocket className="w-3 h-3" />
                          Build
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-[#8a8a9a] mb-2">{finding.description}</p>
                    <div className="flex items-center gap-2 text-sm">
                      <ArrowRight className="w-4 h-4 text-[#5b8aff]" />
                      <span className="text-[#f0f0f5]">{finding.recommendation}</span>
                    </div>
                  </div>
                  
                  {selectedFinding?.id === finding.id && implementation && (
                    <div className="mt-2 p-3 rounded-lg bg-[#0a0a0f] border border-white/[0.06]">
                      <div className="flex items-center gap-3">
                        {implementation.status === "in_progress" && (
                          <Loader2 className="w-4 h-4 text-[#5b8aff] animate-spin" />
                        )}
                        {implementation.status === "completed" && (
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                        )}
                        <div className="flex-1">
                          <p className="text-sm text-white">{implementation.message}</p>
                          {implementation.progress > 0 && (
                            <div className="mt-1 h-1 bg-white/[0.04] rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-[#5b8aff] transition-all duration-300"
                                style={{ width: `${implementation.progress}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {implementation.prUrl && (
                        <a 
                          href={implementation.prUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 flex items-center gap-1 text-sm text-[#5b8aff] hover:underline"
                        >
                          <GitBranch className="w-3 h-3" />
                          View Pull Request
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      
                      {implementation.deployUrl && (
                        <a 
                          href={implementation.deployUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 flex items-center gap-1 text-sm text-emerald-400 hover:underline"
                        >
                          <Rocket className="w-3 h-3" />
                          View Live Deployment
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  )}
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
