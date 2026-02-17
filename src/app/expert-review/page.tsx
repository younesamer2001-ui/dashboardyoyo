"use client";

import { useState, useEffect, useRef } from "react";
import {
  Users, Send, Palette, FileText, Plug, Gauge, CheckCircle,
  Loader2, Lightbulb, AlertCircle, ArrowRight, Sparkles,
  ChevronDown, ChevronUp, Target, TrendingUp, Eye
} from "lucide-react";

interface Expert {
  id: string;
  name: string;
  role: string;
  specialty: string;
  icon: any;
  color: string;
  bgColor: string;
  responsibilities: string[];
}

interface ReviewFinding {
  id: string;
  category: "ui" | "content" | "integration" | "performance";
  severity: "critical" | "improvement" | "suggestion";
  title: string;
  description: string;
  recommendation: string;
  effort: "low" | "medium" | "high";
  impact: "low" | "medium" | "high";
}

interface ExpertReview {
  expertId: string;
  summary: string;
  findings: ReviewFinding[];
  topPriorities: string[];
}

interface TeamDiscussion {
  id: string;
  expertId: string;
  message: string;
  timestamp: string;
  type: "analysis" | "question" | "agreement" | "concern";
}

interface FinalRecommendation {
  quickWins: ReviewFinding[];
  strategicImprovements: ReviewFinding[];
  longTermVision: string[];
  estimatedImpact: string;
}

// The 4 Expert Agents
const experts: Expert[] = [
  {
    id: "ui-expert",
    name: "Maya",
    role: "UI/UX Lead",
    specialty: "Visual hierarchy, usability, design systems",
    icon: Palette,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    responsibilities: [
      "Visual consistency",
      "User flow optimization",
      "Mobile responsiveness",
      "Accessibility (WCAG)",
      "Interaction design"
    ]
  },
  {
    id: "content-expert",
    name: "Oliver",
    role: "Content Strategist",
    specialty: "Information architecture, copy, clarity",
    icon: FileText,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    responsibilities: [
      "Content hierarchy",
      "Labeling & terminology",
      "Information density",
      "Empty states",
      "User guidance"
    ]
  },
  {
    id: "integration-expert",
    name: "Nina",
    role: "Integration Specialist",
    specialty: "APIs, data sources, automation",
    icon: Plug,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    responsibilities: [
      "Data source reliability",
      "API integration quality",
      "Real-time updates",
      "Error handling",
      "Feature completeness"
    ]
  },
  {
    id: "performance-expert",
    name: "Paul",
    role: "Performance & QA Lead",
    specialty: "Speed, stability, testing, monitoring",
    icon: Gauge,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    responsibilities: [
      "Page load speed",
      "Build optimization",
      "Error monitoring",
      "Browser compatibility",
      "Security basics"
    ]
  }
];

export default function ExpertReviewTeam() {
  const [phase, setPhase] = useState<"idle" | "discussing" | "reviewing" | "presenting" | "approved">("idle");
  const [discussions, setDiscussions] = useState<TeamDiscussion[]>([]);
  const [reviews, setReviews] = useState<ExpertReview[]>([]);
  const [finalRecommendation, setFinalRecommendation] = useState<FinalRecommendation | null>(null);
  const [selectedExpert, setSelectedExpert] = useState<string | null>(null);
  const [userInput, setUserInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [discussions]);

  const startReview = async () => {
    setPhase("discussing");
    setIsProcessing(true);
    
    // Each expert introduces themselves and starts analyzing
    for (const expert of experts) {
      await addDiscussion(expert.id, getOpeningAnalysis(expert), "analysis");
      await delay(800);
    }

    // Cross-expert discussion
    await runCrossDiscussion();
    
    // Generate individual reviews
    setPhase("reviewing");
    await generateExpertReviews();
    
    // Compile final recommendation
    await compileFinalRecommendation();
    
    setPhase("presenting");
    setIsProcessing(false);
  };

  const runCrossDiscussion = async () => {
    const crossTalks = [
      { from: "ui-expert", to: "integration-expert", msg: "Nina, I'm concerned about the loading states while data fetches. Can we show better skeleton screens?" },
      { from: "integration-expert", to: "ui-expert", msg: "Good point, Maya. I can add progressive loading. The Yahoo Finance API is reliable, but we should handle offline states better." },
      { from: "content-expert", to: "ui-expert", msg: "Maya, the 'News' section title is too generic. Should we be more specific about it being financial news?" },
      { from: "ui-expert", to: "content-expert", msg: "Agreed, Oliver. 'Markets & Finance' would be clearer. Also, we need better empty states for the news feed." },
      { from: "performance-expert", to: "integration-expert", msg: "Nina, the chart data is quite heavy. Can we implement data caching or virtualization for the 1-year view?" },
      { from: "integration-expert", to: "performance-expert", msg: "Absolutely, Paul. I'll suggest downsampling for longer time ranges. We don't need hourly data for 1-year views." },
      { from: "content-expert", to: "performance-expert", msg: "Paul, are the commodity descriptions clear enough? I worry new users won't understand what 'BRENT' means." },
      { from: "performance-expert", to: "content-expert", msg: "Valid concern. Adding tooltips or a legend would help without hurting performance." },
    ];

    for (const talk of crossTalks) {
      const expert = experts.find(e => e.id === talk.from)!;
      await addDiscussion(expert.id, talk.msg, "question");
      await delay(1000);
    }
  };

  const generateExpertReviews = async () => {
    const expertReviews: ExpertReview[] = [
      {
        expertId: "ui-expert",
        summary: "Strong visual foundation with Linear-inspired design, but several UX improvements needed before launch.",
        findings: [
          {
            id: "ui-1",
            category: "ui",
            severity: "improvement",
            title: "Chart modal lacks loading state",
            description: "When clicking a commodity, the chart area shows empty space while data loads.",
            recommendation: "Add animated skeleton loader matching the chart dimensions",
            effort: "low",
            impact: "medium"
          },
          {
            id: "ui-2",
            category: "ui",
            severity: "suggestion",
            title: "Commodity cards could show sparklines",
            description: "Visual trend indication in the grid view would help users spot changes at a glance.",
            recommendation: "Add mini sparkline charts to each commodity card",
            effort: "medium",
            impact: "high"
          },
          {
            id: "ui-3",
            category: "ui",
            severity: "critical",
            title: "Mobile chart experience needs work",
            description: "Charts are hard to interact with on mobile devices.",
            recommendation: "Implement pinch-to-zoom and optimize touch targets",
            effort: "high",
            impact: "high"
          }
        ],
        topPriorities: ["Mobile chart optimization", "Loading states", "Sparkline previews"]
      },
      {
        expertId: "content-expert",
        summary: "Content structure is good, but clarity and guidance need improvement for first-time users.",
        findings: [
          {
            id: "content-1",
            category: "content",
            severity: "improvement",
            title: "Commodity symbols are cryptic",
            description: "Users may not understand 'BRENT', 'ALUM', or 'NATGAS' abbreviations.",
            recommendation: "Add full names on hover or expand cards to show descriptions",
            effort: "low",
            impact: "high"
          },
          {
            id: "content-2",
            category: "content",
            severity: "suggestion",
            title: "News section lacks context",
            description: "The news feed doesn't explain why these specific sources were chosen.",
            recommendation: "Add a brief 'About' section explaining the curation",
            effort: "low",
            impact: "low"
          },
          {
            id: "content-3",
            category: "content",
            severity: "improvement",
            title: "Empty news state is too minimal",
            description: "When no news match filters, the message is too basic.",
            recommendation: "Add helpful suggestions and quick filter reset options",
            effort: "low",
            impact: "medium"
          }
        ],
        topPriorities: ["Explain commodity symbols", "Better empty states", "Source context"]
      },
      {
        expertId: "integration-expert",
        summary: "Good data architecture, but error handling and data freshness need attention.",
        findings: [
          {
            id: "int-1",
            category: "integration",
            severity: "critical",
            title: "No fallback if Yahoo Finance fails",
            description: "If the API is down or rate-limited, users see stale or missing data without explanation.",
            recommendation: "Implement cached data with 'last updated' timestamps and error messages",
            effort: "medium",
            impact: "high"
          },
          {
            id: "int-2",
            category: "integration",
            severity: "improvement",
            title: "NOK rate uses mock data",
            description: "NOK/EUR rate isn't fetched from a real source like Norges Bank.",
            recommendation: "Integrate Norges Bank API for official NOK rates",
            effort: "medium",
            impact: "high"
          },
          {
            id: "int-3",
            category: "integration",
            severity: "suggestion",
            title: "Could add more commodities",
            description: "Only 5 commodities tracked; users might want silver, wheat, or crypto.",
            recommendation: "Add Silver (SI=F) and Bitcoin futures as additional options",
            effort: "low",
            impact: "medium"
          }
        ],
        topPriorities: ["API error handling", "Real NOK source", "More commodities"]
      },
      {
        expertId: "performance-expert",
        summary: "Performance is acceptable for MVP, but several optimizations needed for scale.",
        findings: [
          {
            id: "perf-1",
            category: "performance",
            severity: "improvement",
            title: "Chart data not optimized",
            description: "Loading full year of hourly data (8760 points) for all charts is overkill.",
            recommendation: "Downsample data based on selected time range (daily for 1y, hourly for 1d)",
            effort: "medium",
            impact: "high"
          },
          {
            id: "perf-2",
            category: "performance",
            severity: "suggestion",
            title: "No data prefetching",
            description: "Users wait for data to load after clicking a commodity.",
            recommendation: "Prefetch chart data on hover or during idle time",
            effort: "medium",
            impact: "medium"
          },
          {
            id: "perf-3",
            category: "performance",
            severity: "critical",
            title: "Build times increasing",
            description: "As features grow, Vercel build times may exceed hobby plan limits.",
            recommendation: "Implement dynamic imports and code splitting",
            effort: "high",
            impact: "medium"
          }
        ],
        topPriorities: ["Data downsampling", "Build optimization", "Prefetching"]
      }
    ];

    for (const review of expertReviews) {
      setReviews(prev => [...prev, review]);
      await delay(600);
    }
  };

  const compileFinalRecommendation = async () => {
    const allFindings = reviews.flatMap(r => r.findings);
    
    const recommendation: FinalRecommendation = {
      quickWins: allFindings.filter(f => f.effort === "low" && f.impact === "high"),
      strategicImprovements: allFindings.filter(f => f.effort === "medium" || f.effort === "high"),
      longTermVision: [
        "Personalized watchlists - users can favorite specific commodities",
        "Price alerts - notifications when commodities hit target prices",
        "Portfolio tracking - connect to broker APIs for real portfolio view",
        "AI-powered insights - trend analysis and prediction indicators",
        "Mobile app - native iOS/Android apps with push notifications"
      ],
      estimatedImpact: "Addressing the 'Quick Wins' will improve user satisfaction by ~40%. Full implementation of all recommendations positions this as a professional-grade financial dashboard."
    };

    setFinalRecommendation(recommendation);
  };

  const addDiscussion = async (expertId: string, message: string, type: TeamDiscussion["type"]) => {
    const discussion: TeamDiscussion = {
      id: `disc-${Date.now()}`,
      expertId,
      message,
      timestamp: new Date().toISOString(),
      type
    };
    setDiscussions(prev => [...prev, discussion]);
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const getOpeningAnalysis = (expert: Expert): string => {
    const openings: Record<string, string> = {
      "ui-expert": "I'm reviewing the visual design and user experience. Overall, the Linear-inspired aesthetic is strong, but I see opportunities to improve information hierarchy and mobile experience.",
      "content-expert": "Looking at information architecture and content clarity. The dashboard communicates well, but some labels and empty states could be more helpful for first-time users.",
      "integration-expert": "Examining data sources and API integrations. The Yahoo Finance setup is solid, but error handling and data freshness need attention before public launch.",
      "performance-expert": "Analyzing load times and optimization. Performance is acceptable for MVP, but chart data loading and build times need work as we scale."
    };
    return openings[expert.id] || "Beginning my analysis...";
  };

  const handleApproveImplementation = () => {
    setPhase("approved");
    // Here you would trigger the actual implementation
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "text-red-400 bg-red-500/10 border-red-500/20";
      case "improvement": return "text-amber-400 bg-amber-500/10 border-amber-500/20";
      case "suggestion": return "text-blue-400 bg-blue-500/10 border-blue-500/20";
      default: return "text-[#8a8a9a] bg-white/[0.04]";
    }
  };

  const getEffortBadge = (effort: string) => {
    const colors = {
      low: "text-emerald-400",
      medium: "text-amber-400",
      high: "text-red-400"
    };
    return colors[effort as keyof typeof colors] || "text-[#8a8a9a]";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white flex items-center gap-3">
            <Users className="w-6 h-6 text-[#5b8aff]" />
            Expert Review Team
          </h1>
          <p className="text-[#8a8a9a] mt-1">
            {phase === "idle" && "Ready to analyze your dashboard"}
            {phase === "discussing" && "Experts are discussing findings..."}
            {phase === "reviewing" && "Compiling individual reviews..."}
            {phase === "presenting" && "Review complete - awaiting your decision"}
            {phase === "approved" && "Implementation approved"}
          </p>
        </div>

        {phase === "idle" ? (
          <button
            onClick={startReview}
            disabled={isProcessing}
            className="px-6 py-3 bg-[#5b8aff] text-white rounded-xl font-medium hover:bg-[#5b8aff]/90 transition-colors flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Start Expert Review
          </button>
        ) : phase === "presenting" ? (
          <button
            onClick={handleApproveImplementation}
            className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-500/90 transition-colors flex items-center gap-2"
          >
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

      {/* Expert Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {experts.map((expert) => {
          const Icon = expert.icon;
          const hasReviewed = reviews.some(r => r.expertId === expert.id);
          
          return (
            <button
              key={expert.id}
              onClick={() => setSelectedExpert(selectedExpert === expert.id ? null : expert.id)}
              className={`p-4 rounded-xl border text-left transition-all ${
                selectedExpert === expert.id
                  ? `${expert.bgColor} border-white/[0.1]`
                  : "bg-[#13131f] border-white/[0.06] hover:border-white/[0.1]"
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-lg ${expert.bgColor} flex items-center justify-center`>
                  <Icon className={`w-5 h-5 ${expert.color}`} />
                </div>
                <div>
                  <p className="font-medium text-white">{expert.name}</p>
                  <p className={`text-xs ${expert.color}`}>{expert.role}</p>
                </div>
              </div>

              <p className="text-xs text-[#8a8a9a] line-clamp-2">{expert.specialty}</p>

              {hasReviewed && (
                <div className="mt-3 flex items-center gap-1 text-emerald-400 text-xs"
                >
                  <CheckCircle className="w-3 h-3" />
                  Review complete
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Discussion Phase */}
      {(phase === "discussing" || phase === "reviewing") && discussions.length > 0 && (
        <div className="bg-[#13131f] rounded-xl border border-white/[0.06] p-4">
          <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
            <Eye className="w-4 h-4 text-[#5b8aff]" />
            Expert Discussion
          </h3>
          
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {discussions.map((disc, idx) => {
              const expert = experts.find(e => e.id === disc.expertId)!;
              const Icon = expert.icon;
              
              return (
                <div key={disc.id} className="flex gap-3">
                  <div className={`w-8 h-8 rounded-lg ${expert.bgColor} flex items-center justify-center flex-shrink-0`>
                    <Icon className={`w-4 h-4 ${expert.color}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-white">{expert.name}</span>
                      <span className="text-xs text-[#5a5a6a]">{expert.role}</span>
                    </div>
                    <p className="text-sm text-[#8a8a9a]">{disc.message}</p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}

      {/* Final Recommendations */}
      {phase === "presenting" && finalRecommendation && (
        <div className="space-y-6">
          {/* Summary Card */}
          <div className="bg-gradient-to-r from-[#5b8aff]/10 to-purple-500/10 rounded-xl border border-[#5b8aff]/20 p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#5b8aff]/20 flex items-center justify-center">
                <Target className="w-6 h-6 text-[#5b8aff]" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">Executive Summary</h3>
                <p className="text-[#f0f0f5] mb-4">{finalRecommendation.estimatedImpact}</p>
                
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-sm">
                    {finalRecommendation.quickWins.length} Quick Wins
                  </span>
                  <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-sm">
                    {finalRecommendation.strategicImprovements.length} Strategic Items
                  </span>
                  <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-sm">
                    {finalRecommendation.longTermVision.length} Future Ideas
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Wins */}
          <div className="bg-[#13131f] rounded-xl border border-white/[0.06] p-4">
            <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-emerald-400" />
              Quick Wins (Do These First)
            </h3>
            
            <div className="space-y-3">
              {finalRecommendation.quickWins.map((finding) => (
                <div key={finding.id} className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-white">{finding.title}</h4>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs ${getEffortBadge(finding.effort)}`}>
                        {finding.effort} effort
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getSeverityColor(finding.severity)}`}>
                        {finding.severity}
                      </span>
                    </div>
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

          {/* Strategic Improvements */}
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
                    <div className="flex items-center gap-2">
                      <span className={`text-xs ${getEffortBadge(finding.effort)}`}>
                        {finding.effort} effort
                      </span>
                    </div>
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

          {/* Long Term Vision */}
          <div className="bg-[#13131f] rounded-xl border border-white/[0.06] p-4">
            <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              Long-Term Vision
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {finalRecommendation.longTermVision.map((idea, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-medium">
                    {idx + 1}
                  </span>
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
