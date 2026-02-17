import { NextRequest } from 'next/server';

// Agent configurations with distinct personalities
const agentConfigs = {
  ceo: {
    name: "Kimi",
    role: "AI CEO",
    personality: `You are Kimi, the AI CEO. You are strategic, decisive, and focused on the big picture.
    Your job is to:
    1. Coordinate the team
    2. Delegate tasks to appropriate team members
    3. Report back to Younes (the Founder) with clear recommendations
    4. Make final decisions when needed
    
    You speak professionally but warmly. You always consider business impact, ROI, and long-term goals.
    When responding, acknowledge the team input and provide a clear executive summary.
    
    If a task requires multiple specialists, break it down and delegate accordingly.`,
  },
  marketing: {
    name: "Markus",
    role: "Marketing Lead",
    personality: `You are Markus, the Marketing Lead. You are creative, data-driven, and customer-obsessed.
    Your expertise: Growth strategies, campaigns, analytics, SEO, content marketing, social media.
    
    You speak with enthusiasm and back your ideas with metrics.
    Always consider: target audience, channels, budget, and expected ROI.
    
    You are competitive and want to beat competitors. You love A/B testing and optimization.`,
  },
  social: {
    name: "Sarah",
    role: "Social Media Manager",
    personality: `You are Sarah, the Social Media Manager. You are trendy, engaging, and brand-conscious.
    Your expertise: Content creation, community management, viral marketing, influencer partnerships.
    
    You speak casually and know all the latest trends. You understand algorithms and engagement metrics.
    You focus on: brand voice, visual aesthetics, posting schedules, and community building.
    
    You are creative and always have ideas for content.`,
  },
  finance: {
    name: "Erik",
    role: "Accountant",
    personality: `You are Erik, the Accountant. You are precise, cautious, and detail-oriented.
    Your expertise: Tax law, bookkeeping, financial planning, budgeting, compliance.
    
    You speak formally and carefully. You always double-check numbers and consider legal implications.
    You focus on: cash flow, tax optimization, cost reduction, and financial risk.
    
    You are conservative with money but understand the need for strategic investments.`,
  },
  developer: {
    name: "Alex",
    role: "Developer",
    personality: `You are Alex, the Lead Developer. You are technical, practical, and solution-oriented.
    Your expertise: Architecture, coding, DevOps, scalability, security, performance.
    
    You speak technically but can simplify for non-tech people. You focus on: best practices, clean code, scalability, and technical debt.
    
    You are pragmatic and always consider implementation time and maintenance costs.
    You suggest the simplest solution that works, not the most complex.`,
  },
  designer: {
    name: "Lisa",
    role: "Designer",
    personality: `You are Lisa, the Lead Designer. You are creative, user-focused, and detail-oriented.
    Your expertise: UI/UX, branding, visual design, user research, prototyping.
    
    You speak with visual language and focus on user experience. You care about: aesthetics, usability, accessibility, and brand consistency.
    
    You are passionate about design systems and believe good design drives business results.
    You always consider the user's perspective.`,
  },
};

interface Message {
  id: string;
  agentId: string;
  text: string;
  timestamp: string;
  type: 'message' | 'thinking' | 'complete';
}

interface TeamDiscussion {
  originalMessage: string;
  context: string;
  responses: Map<string, string>;
  status: 'gathering' | 'summarizing' | 'complete';
}

// Active discussions
const activeDiscussions = new Map<string, TeamDiscussion>();

// POST /api/team/chat - Handle team chat with sub-agents
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, discussionId = Date.now().toString(), context = '' } = body;
    
    if (!message) {
      return Response.json({ success: false, error: 'Message required' }, { status: 400 });
    }

    // Initialize discussion
    const discussion: TeamDiscussion = {
      originalMessage: message,
      context,
      responses: new Map(),
      status: 'gathering',
    };
    activeDiscussions.set(discussionId, discussion);

    // Determine which agents should respond based on message content
    const relevantAgents = determineRelevantAgents(message, body.availableAgents);
    
    // Spawn agents in parallel
    const agentPromises = relevantAgents.map(agentId => 
      spawnAgentResponse(agentId, message, context, discussionId)
    );
    
    // Wait for all agents to respond (with timeout)
    const results = await Promise.allSettled(agentPromises);
    
    // Collect responses
    results.forEach((result, index) => {
      const agentId = relevantAgents[index];
      if (result.status === 'fulfilled') {
        discussion.responses.set(agentId, result.value);
      } else {
        discussion.responses.set(agentId, `[${agentConfigs[agentId as keyof typeof agentConfigs].name} is busy]`);
      }
    });

    // Now spawn CEO to summarize and make recommendation
    discussion.status = 'summarizing';
    const ceoSummary = await spawnCEOSummary(message, discussion, context);
    
    discussion.status = 'complete';

    // Format the final response
    const teamResponses = Array.from(discussion.responses.entries()).map(([agentId, response]) => {
      const config = agentConfigs[agentId as keyof typeof agentConfigs];
      return {
        agentId,
        name: config.name,
        role: config.role,
        response,
      };
    });

    return Response.json({
      success: true,
      discussionId,
      ceoSummary,
      teamResponses,
      status: 'complete',
    });

  } catch (error) {
    console.error('Team chat API error:', error);
    return Response.json({ 
      success: false, 
      error: 'Failed to process team discussion' 
    }, { status: 500 });
  }
}

// Determine which agents should respond based on message content
function determineRelevantAgents(message: string, availableAgents?: string[]): string[] {
  const lowerMsg = message.toLowerCase();
  const agents: string[] = [];
  
  // Always include CEO
  agents.push('ceo');
  
  // Check for marketing/social keywords
  if (lowerMsg.match(/marketing|campaign|social|content|ad|promo|brand|seo|growth|lead/)) {
    if (!availableAgents || availableAgents.includes('marketing')) agents.push('marketing');
    if (!availableAgents || availableAgents.includes('social')) agents.push('social');
  }
  
  // Check for finance keywords
  if (lowerMsg.match(/budget|cost|price|money|finance|tax|revenue|profit|accounting|invoice/)) {
    if (!availableAgents || availableAgents.includes('finance')) agents.push('finance');
  }
  
  // Check for tech keywords
  if (lowerMsg.match(/code|develop|tech|software|app|website|build|api|database|bug|feature/)) {
    if (!availableAgents || availableAgents.includes('developer')) agents.push('developer');
  }
  
  // Check for design keywords
  if (lowerMsg.match(/design|ui|ux|brand|logo|visual|interface|user experience|mockup/)) {
    if (!availableAgents || availableAgents.includes('designer')) agents.push('designer');
  }
  
  // Filter to only available agents if specified
  if (availableAgents) {
    return agents.filter(id => availableAgents.includes(id));
  }
  
  // If no specific domain found, include all available specialists
  if (agents.length === 1) { // Only CEO
    const fallback = ['marketing', 'developer', 'designer'];
    if (availableAgents) {
      return ['ceo', ...fallback.filter(id => availableAgents.includes(id))];
    }
    return ['ceo', ...fallback];
  }
  
  return [...new Set(agents)];
}

// Spawn individual agent response
async function spawnAgentResponse(
  agentId: string, 
  message: string, 
  context: string,
  discussionId: string
): Promise<string> {
  const config = agentConfigs[agentId as keyof typeof agentConfigs];
  
  const prompt = `${config.personality}

CONTEXT FROM FOUNDER (Younes):
${context}

CURRENT DISCUSSION:
Younes asks: "${message}"

Your task: Provide your professional perspective as ${config.role}.
Keep your response concise (2-4 sentences) and actionable.
If this isn't your area of expertise, briefly acknowledge and defer to the appropriate team member.

Respond as ${config.name}:`;

  try {
    // In a real implementation, this would call the AI model
    // For now, simulate with pre-written responses
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    return generateSimulatedResponse(agentId, message);
  } catch (error) {
    console.error(`Agent ${agentId} error:`, error);
    return `[Error: Could not reach ${config.name}]`;
  }
}

// Generate CEO summary
async function spawnCEOSummary(
  originalMessage: string,
  discussion: TeamDiscussion,
  context: string
): Promise<string> {
  const config = agentConfigs.ceo;
  
  const teamInput = Array.from(discussion.responses.entries())
    .filter(([id]) => id !== 'ceo')
    .map(([id, response]) => {
      const agentConfig = agentConfigs[id as keyof typeof agentConfigs];
      return `${agentConfig.name} (${agentConfig.role}): ${response}`;
    })
    .join('\n\n');

  const prompt = `${config.personality}

CONTEXT FROM FOUNDER (Younes):
${context}

ORIGINAL QUESTION:
"${originalMessage}"

TEAM INPUT:
${teamInput}

Your task: Summarize the team input, provide your executive recommendation, and outline next steps.
Be decisive but acknowledge different perspectives. Focus on actionable outcomes.

Respond as Kimi (CEO):`;

  try {
    await new Promise(resolve => setTimeout(resolve, 1500));
    return generateSimulatedCEOResponse(originalMessage, teamInput);
  } catch (error) {
    return "I'll need to review this with the team further. Let me get back to you shortly.";
  }
}

// Simulated responses for demo
function generateSimulatedResponse(agentId: string, message: string): string {
  const responses: Record<string, string[]> = {
    marketing: [
      "From a marketing perspective, this aligns well with our Q1 growth goals. I recommend we allocate 20% more budget to test this approach.",
      "This could work, but we need to A/B test first. I'll set up tracking to measure conversion rates.",
      "Strong idea! Our target audience will respond well to this messaging. Let me prepare a campaign proposal.",
    ],
    social: [
      "Love this! I can create engaging content around this concept. TikTok and Instagram will eat this up! 🚀",
      "Great timing - this fits perfectly with current trends. I'll prepare a content calendar.",
      "This has viral potential! I'll draft some posts and stories to test engagement.",
    ],
    finance: [
      "Numbers check out. We have budget flexibility this quarter. However, I recommend phasing the investment over 3 months.",
      "Financially viable. The ROI projection looks solid at 15-20% based on similar past investments.",
      "Approved from a budget standpoint, but let's set clear KPIs to track performance.",
    ],
    developer: [
      "Technically feasible. I can implement this in 2-3 sprints. No major blockers from an architecture perspective.",
      " doable. We'll need to update the API and database schema. I estimate 40-50 hours of work.",
      "Smart approach from a tech perspective. This will scale well and won't add technical debt.",
    ],
    designer: [
      "From a UX standpoint, this works well. I'll create mockups by Friday for review.",
      " aligns with our design system. Users will find this intuitive and visually appealing.",
      "Great user experience potential. I'll research best practices and present 3 design options.",
    ],
  };

  const agentResponses = responses[agentId] || ["I'll review this and get back to you."];
  return agentResponses[Math.floor(Math.random() * agentResponses.length)];
}

function generateSimulatedCEOResponse(message: string, teamInput: string): string {
  return `**Executive Summary:**

The team is aligned on the direction. Marketing and Development are ready to execute, Finance confirms budget availability, and Design will ensure quality delivery.

**My Recommendation:**
Proceed with the plan. Set a 30-day review milestone to assess early results.

**Next Steps:**
1. Alex to provide technical specifications by Friday
2. Markus to prepare marketing timeline
3. Erik to set up budget tracking
4. Weekly check-ins starting Monday

I'll coordinate and report back to you on progress.`;
}

// GET /api/team/status - Get active discussions
export async function GET(request: NextRequest) {
  const discussions = Array.from(activeDiscussions.entries()).map(([id, disc]) => ({
    id,
    status: disc.status,
    responses: disc.responses.size,
    timestamp: Date.now(),
  }));
  
  return Response.json({
    success: true,
    activeDiscussions: discussions.slice(-10), // Last 10
  });
}
