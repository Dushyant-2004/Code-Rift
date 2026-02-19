const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const VALID_TYPES = new Set([
  "bug", "code_smell", "performance", "security", "readability",
  "optimization", "syntax", "style", "best_practice", "error_handling",
  "maintainability", "complexity", "other",
]);

const VALID_SEVERITIES = new Set(["critical", "high", "medium", "low", "info"]);

function normalizeIssueType(type) {
  if (!type) return "code_smell";
  const t = type.toLowerCase().replace(/[\s-]/g, "_");
  if (VALID_TYPES.has(t)) return t;
  // Map common AI-generated types to valid ones
  if (t.includes("bug") || t.includes("error") || t.includes("defect")) return "bug";
  if (t.includes("syntax")) return "syntax";
  if (t.includes("style") || t.includes("format")) return "style";
  if (t.includes("security") || t.includes("vuln")) return "security";
  if (t.includes("perf")) return "performance";
  if (t.includes("read")) return "readability";
  if (t.includes("optim")) return "optimization";
  if (t.includes("maintain")) return "maintainability";
  if (t.includes("complex")) return "complexity";
  if (t.includes("best") || t.includes("practice")) return "best_practice";
  if (t.includes("handle") || t.includes("exception")) return "error_handling";
  return "other";
}

function normalizeIssueSeverity(severity) {
  if (!severity) return "medium";
  const s = severity.toLowerCase().trim();
  if (VALID_SEVERITIES.has(s)) return s;
  if (s.includes("crit")) return "critical";
  if (s.includes("high") || s.includes("major")) return "high";
  if (s.includes("low") || s.includes("minor")) return "low";
  if (s.includes("info") || s.includes("note") || s.includes("trivial")) return "info";
  return "medium";
}

function buildPrompt(code, language) {
  return `You are an expert senior code reviewer. Analyze the following ${language} code and provide a thorough, structured review.

Return your response as a valid JSON object with EXACTLY this structure (no markdown, no code fences, pure JSON only):

{
  "summary": "Brief overall assessment of the code quality (2-3 sentences)",
  "score": <number 0-100>,
  "overallRating": "<Excellent|Good|Average|Below Average|Poor>",
  "strengths": ["list of things done well"],
  "issues": [
    {
      "type": "<bug|code_smell|performance|security|readability|optimization|syntax|style|best_practice|error_handling|maintainability|complexity>",
      "severity": "<critical|high|medium|low|info>",
      "title": "Short title",
      "description": "Detailed explanation of the issue",
      "line": <line number or null if general>,
      "suggestion": "How to fix or improve this"
    }
  ]
}

Rules:
- Score 90-100: Excellent code with minimal issues
- Score 70-89: Good code with minor improvements needed
- Score 50-69: Average code with several issues
- Score 30-49: Below average with significant problems
- Score 0-29: Poor code needing major refactoring
- Always provide actionable suggestions
- Be specific about line numbers when possible
- Include at least one item in strengths
- If code is very short or trivial, still provide useful feedback
- Return ONLY valid JSON, no additional text

Code to review:
\`\`\`${language}
${code}
\`\`\``;
}

async function analyzeCode(code, language) {
  const prompt = buildPrompt(code, language);

  const completion = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      {
        role: "system",
        content: "You are a code review expert. Always respond with valid JSON only. No markdown formatting, no code fences, no explanatory text outside the JSON.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.3,
    max_tokens: 4096,
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    throw new Error("Empty response from Groq API");
  }

  try {
    const parsed = JSON.parse(raw);

    // Validate and normalize the response
    return {
      summary: parsed.summary || "Analysis complete.",
      score: Math.min(100, Math.max(0, parseInt(parsed.score) || 50)),
      overallRating: parsed.overallRating || "Average",
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      issues: Array.isArray(parsed.issues)
        ? parsed.issues.map((issue) => ({
            type: normalizeIssueType(issue.type),
            severity: normalizeIssueSeverity(issue.severity),
            title: issue.title || "Issue found",
            description: issue.description || "",
            line: issue.line || null,
            suggestion: issue.suggestion || "",
          }))
        : [],
    };
  } catch (parseErr) {
    console.error("Failed to parse Groq response:", raw);
    throw new Error("Failed to parse AI response");
  }
}

module.exports = { analyzeCode };
