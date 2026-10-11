const GEMINI_MODEL = 'gemini-3.1-flash-lite';

async function callGemini(apiKey, prompt) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gemini API error (${response.status})`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

function parseJSON(text) {
  const cleaned = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
  return JSON.parse(cleaned);
}

export async function generateWeeklyPlan(apiKey, { goal, skillLevel, dailyMinutes }) {
  const prompt = `You are an art practice coach. Generate a focused 7-day practice plan for a ${skillLevel} artist whose goal is: "${goal}". They have ${dailyMinutes} minutes per day.

Return ONLY valid JSON (no markdown, no code blocks, no explanation) with this exact structure:
{
  "goal": "${goal}",
  "days": [
    {
      "day": 1,
      "title": "Short day title",
      "exercises": [
        {
          "name": "Exercise name",
          "duration": 20,
          "description": "1-2 sentence description of what to practice and how",
          "skill": "gesture",
          "xp": 30
        }
      ]
    }
  ]
}

Rules:
- Each day has 1-3 exercises. Total time per day must be close to ${dailyMinutes} minutes.
- skill must be one of: gesture, anatomy, perspective, composition, lighting, linework
- xp should be 20-50 based on difficulty
- Progress logically from foundational to complex over the 7 days
- Be specific and actionable (e.g. "Draw 10 cat gesture sketches focusing on spine curve" not just "draw cats")
- IMPORTANT: Each exercise must focus on exactly ONE subject (e.g. only eyes, only hair, only hands). Never combine two subjects in one exercise name or description. If you want to cover eyes AND hair, make them two separate exercises.
- Use plain descriptive names for exercises. Avoid named art methods (e.g. do NOT use "Loomis Method", "Bridgman Forms"). Describe what to draw, not the technique name.`;

  const text = await callGemini(apiKey, prompt);
  return parseJSON(text);
}

export async function generateDailyMissions(apiKey, { goal, skillLevel, skills }) {
  const skillSummary = Object.entries(skills)
    .map(([, v]) => `${v.name} Lv.${v.level}`)
    .join(', ');

  const prompt = `You are an art practice coach. Generate exactly 3 daily practice missions.

Artist profile:
- Goal: ${goal}
- Skill level: ${skillLevel}
- Current skills: ${skillSummary}

Return ONLY a valid JSON array (no markdown, no code blocks):
[
  {
    "title": "Short mission title",
    "description": "Specific actionable task description (1-2 sentences)",
    "duration": 20,
    "skill": "gesture",
    "xp": 30,
    "difficulty": "easy"
  }
]

Rules:
- skill must be one of: gesture, anatomy, perspective, composition, lighting, linework
- difficulty must be one of: easy, medium, hard
- xp: easy=20, medium=30, hard=50
- Make missions varied across different skills
- Be specific and actionable
- Each mission must focus on exactly ONE subject. Never combine two subjects (e.g. NOT "eyes and hair"). If needed, make separate missions.
- Use plain descriptive names. Avoid named art methods (no "Loomis", "Bridgman", etc.). Say what to draw, not the technique name.`;

  const text = await callGemini(apiKey, prompt);
  return parseJSON(text);
}
