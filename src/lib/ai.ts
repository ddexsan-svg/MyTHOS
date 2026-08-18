// AI Helper for MyTHOS Psychological Intervention

export interface AIServiceResponse {
  summary: string;
  feedback: string;
  encouragement: string;
  cbtSuggestions: string[];
  distortions: string[];
}

const DISTORTION_RULES = [
  {
    name: 'All-or-Nothing Thinking',
    keywords: ['always', 'never', 'nothing', 'everything', 'ruined', 'worst', 'perfect', 'completely', 'failed'],
    description: 'Viewing things in black-and-white categories. If a situation falls short of perfect, you see it as a total failure.'
  },
  {
    name: 'Catastrophizing (Fortune Telling)',
    keywords: ['will fail', 'never get better', 'disaster', 'doom', 'going to fail', 'hopeless', 'end of the world', 'terrible'],
    description: 'Anticipating that things will turn out badly and feeling convinced that the prediction is an already-established fact.'
  },
  {
    name: 'Personalization',
    keywords: ['my fault', 'blame me', 'i caused', 'because of me', 'failed them', 'let everyone down'],
    description: 'Holding yourself personally responsible for an event that isn\'t entirely under your control.'
  },
  {
    name: 'Should Statements',
    keywords: ['should', 'must', 'ought to', 'have to', 'need to be perfect'],
    description: 'Trying to motivate yourself or others with "shoulds" and "shouldn\'ts", leading to guilt and frustration.'
  },
  {
    name: 'Labeling / Self-Criticism',
    keywords: ['useless', 'stupid', 'loser', 'weak', 'failure', 'foolish', 'bad person', 'idiot'],
    description: 'Attaching a negative global label to yourself instead of describing your error in context.'
  }
];

const MYTHOLOGY_CONTEXTS: Record<number, { character: string, narrative: string, advice: string }> = {
  1: {
    character: 'Malakas at Maganda',
    narrative: 'originating from the bamboo tree split by the celestial bird',
    advice: 'Just like Malakas and Maganda, your identity is not pre-determined by your circumstances. You emerged with distinct strengths. Your thoughts may tell you that you are fragile, but inside the bamboo, you were growing and getting ready to stand strong.'
  },
  2: {
    character: 'Bernardo Carpio',
    narrative: 'trapped between two colliding mountains, straining against his chains',
    advice: 'Like Bernardo Carpio, you might feel trapped by heavy burdens or negative thoughts that feel as heavy as colliding mountains. But remember: Bernardo Carpio is a story of immense strength. The chains that bind you are cognitive patterns. By identifying these "inner chains," you can begin to loosen their grip.'
  },
  3: {
    character: 'Biag ni Lam-ang',
    narrative: 'the hero who chose his path, faced monsters, and rose again',
    advice: 'Lam-ang\'s journey teaches us that courage is not the absence of obstacles, but the decision to move forward. Your decisions tree shows that you have choices. You can choose to pack the tools of self-belief and step onto your own Hero\'s path today.'
  },
  4: {
    character: 'Maria Makiling',
    narrative: 'the gentle guardian of the mountain, whose storms reflect her pain but whose nature heals',
    advice: 'Maria Makiling shows us that emotions can be like storms on the mountain—powerful, changing, and temporary. Just as the rain clears to reveal a lush forest, your emotions will pass. Allow yourself to feel without judgment, using breathing to ground yourself.'
  },
  5: {
    character: 'Sarimanok',
    narrative: 'the colorful messenger of hope, carrying dreams to the heavens',
    advice: 'The Sarimanok represents renewal, prosperity, and the power to rise to new heights. You are writing a new story. Your Hope Statement is your wings. Spread them, believe in the positive core beliefs you have created, and let your new story take flight.'
  }
};

// --- SIMULATED AI counselor ---
export function analyzeJournalHeuristics(text: string, sessionNumber: number): AIServiceResponse {
  const lowercaseText = text.toLowerCase();

  // 1. Identify distortions
  const detectedDistortions: string[] = [];
  const suggestions: string[] = [];

  for (const rule of DISTORTION_RULES) {
    const hasKeyword = rule.keywords.some(keyword => lowercaseText.includes(keyword));
    if (hasKeyword) {
      detectedDistortions.push(rule.name);
      if (rule.name === 'All-or-Nothing Thinking') {
        suggestions.push('Try replacing absolute terms like "always" or "never" with more flexible terms like "sometimes" or "this time".');
      } else if (rule.name === 'Catastrophizing (Fortune Telling)') {
        suggestions.push('Ask yourself: What is the actual probability of this disaster happening? What is the best and most realistic outcome?');
      } else if (rule.name === 'Personalization') {
        suggestions.push('Draw a responsibility pie chart. What other external factors or people contributed to this outcome besides you?');
      } else if (rule.name === 'Should Statements') {
        suggestions.push('Rephrase your "I should" to "I would prefer to" or "It would be helpful if I". This reduces self-imposed pressure.');
      } else if (rule.name === 'Labeling / Self-Criticism') {
        suggestions.push('Separate your behavior from your identity. Making a mistake does not make you a "failure"; it makes you human.');
      }
    }
  }

  if (detectedDistortions.length === 0) {
    detectedDistortions.push('No obvious cognitive distortions detected.');
    suggestions.push('Continue monitoring your thoughts. You seem to display balanced, objective thinking in this entry!');
  }

  // 2. Draft summaries based on keywords or length
  let summary = 'The journal entry reflects a period of emotional processing. ';
  if (lowercaseText.length < 20) {
    summary += 'The participant shared a brief reflection about their current state.';
  } else {
    if (lowercaseText.includes('sad') || lowercaseText.includes('hurt') || lowercaseText.includes('pain') || lowercaseText.includes('cry')) {
      summary += 'The participant expresses feelings of vulnerability and emotional weight, dealing with painful experiences.';
    } else if (lowercaseText.includes('worry') || lowercaseText.includes('anxious') || lowercaseText.includes('fear') || lowercaseText.includes('scared')) {
      summary += 'The participant is experiencing anxiety, uncertainty, or fear about future events or current pressures.';
    } else if (lowercaseText.includes('happy') || lowercaseText.includes('hope') || lowercaseText.includes('good') || lowercaseText.includes('proud')) {
      summary += 'The participant expresses positive emotions, progress, and feelings of empowerment and optimism.';
    } else {
      summary += 'The participant is analyzing their thoughts, reflecting on their daily behaviors, and practicing self-awareness.';
    }
  }

  // 3. Draft Mythology advice
  const myth = MYTHOLOGY_CONTEXTS[sessionNumber] || MYTHOLOGY_CONTEXTS[1];
  const encouragement = `Your reflection demonstrates courage. In the context of the story of ${myth.character}, ${myth.advice}`;

  const feedback = `We read your reflection carefully. We detected patterns of: ${detectedDistortions.join(', ')}. CBT teaches us that thoughts are just mental hypotheses, not facts. We encourage you to try the suggestions below to reframe these thoughts.`;

  return {
    summary,
    feedback,
    encouragement,
    cbtSuggestions: suggestions,
    distortions: detectedDistortions
  };
}

// --- CALL GEMINI API (IF KEY PROVIDED) ---
export async function getAIInterventionFeedback(text: string, sessionNumber: number, customApiKey?: string): Promise<AIServiceResponse> {
  const apiKey = customApiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

  if (!apiKey) {
    // Return local high-quality heuristics
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(analyzeJournalHeuristics(text, sessionNumber));
      }, 1000); // Simulate API latency
    });
  }

  const myth = MYTHOLOGY_CONTEXTS[sessionNumber] || MYTHOLOGY_CONTEXTS[1];

  try {
    const prompt = `
      You are MyTHOS AI, an empathetic psychological counselor assisting in a Philippine mythology-inspired CBT intervention.
      
      The participant has submitted the following journal reflection in Session ${sessionNumber} ("${myth.character}" theme):
      "${text}"

      Please analyze this text and return a JSON object with the following fields:
      - "summary": A brief 1-2 sentence clinical summary of the participant's emotional state/themes.
      - "feedback": A therapeutic response identifying any cognitive distortions present (e.g., all-or-nothing, catastrophizing, shoulds, personalization) and advising them on CBT restructuring.
      - "encouragement": A paragraph of empathetic encouragement connecting their struggle to the Philippine narrative of ${myth.character} (${myth.narrative}).
      - "cbtSuggestions": An array of 2-3 specific, actionable CBT restructuring suggestions or reframing exercises.
      - "distortions": An array of strings representing the names of the cognitive distortions detected in their text.

      Ensure the output is valid JSON and contains nothing else. Do not wrap in markdown code blocks.
    `;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API returned status ${response.status}`);
    }

    const resJson = await response.json();
    const responseText = resJson.candidates?.[0]?.content?.parts?.[0]?.text;

    if (responseText) {
      return JSON.parse(responseText.trim()) as AIServiceResponse;
    } else {
      throw new Error('Empty response from Gemini API');
    }
  } catch (error) {
    console.error('Gemini API call failed, falling back to heuristics:', error);
    return analyzeJournalHeuristics(text, sessionNumber);
  }
}

// --- CLINICAL COUNSELOR AI SUMMARIZER ---
export async function getClinicalAIAnalysis(dataDump: string, customApiKey?: string): Promise<string> {
  const apiKey = customApiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

  if (!apiKey) {
    // Return a mocked heuristic response if no API key is available
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve("Counselor Synthesis (Simulated): Base sa pinagsama-samang sagot sa mga aktibidad ng session na ito, ang mag-aaral ay nagpapakita ng positibong pag-unlad at malalim na pag-unawa sa sarili pagdating sa pagkilala ng kanyang sariling emosyon. Sa unang bahagi, malinaw na tinukoy niya ang kanyang patuloy na kaba sa pagharap sa mga bagong sitwasyon, ngunit naging kapansin-pansin din ang pagpili niya sa mas positibo at nakakatulong na mga aksyon (coping mechanisms) nang isagawa ang Hero Choice Module. Napatunayan niyang handa siyang harapin ang mga takot sa loob at labas ng paaralan pagkatapos maiugnay ang kanyang sarili sa kwento nina Malakas at Maganda. Nirerekomenda na patuloy na suportahan ang kanyang inisyatibo na lumabas sa comfort zone, at tutukan sa susunod na pagkikita ang pagbuo pa ng tiwala sa sarili (self-esteem building) upang ganap na mabawasan ang mga natitirang epekto ng cognitive distortions.");
      }, 1500);
    });
  }

  try {
    const prompt = `
      You are an expert psychological counselor assisting another clinical facilitator. 
      You are provided with a raw data dump of a participant's recent mental health CBT activity in a Philippine mythology-themed app.
      
      Participant Data:
      ${dataDump}

      Please analyze this data by unifying all their actual answers and inputs into ONE SINGLE cohesive paragraph.
      Highlight their current emotional state, their CBT progress, and what they specifically shared. Ensure the synthesis is comprehensive, detailed, and about 4-5 sentences long to give the facilitator substantial context.
      CRITICAL INSTRUCTION: Return ONLY the text in exactly ONE unified paragraph. Do not use break lines, bullet points, markdown blocks, or JSON. The response must be a single continuous long paragraph.
    `;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API returned status ${response.status}`);
    }

    const resJson = await response.json();
    const responseText = resJson.candidates?.[0]?.content?.parts?.[0]?.text;

    return responseText ? responseText.trim() : "Unable to generate summary at this time.";
  } catch (error) {
    console.error('Gemini API call failed, falling back to local text:', error);
    return "Counselor Synthesis (Simulated): Base sa pinagsama-samang sagot sa mga aktibidad ng session na ito, ang mag-aaral ay nagpapakita ng positibong pag-unlad at malalim na pag-unawa sa sarili pagdating sa pagkilala ng kanyang sariling emosyon. Sa unang bahagi, malinaw na tinukoy niya ang kanyang patuloy na kaba sa pagharap sa mga bagong sitwasyon, ngunit naging kapansin-pansin din ang pagpili niya sa mas positibo at nakakatulong na mga aksyon (coping mechanisms) nang isagawa ang Hero Choice Module. Napatunayan niyang handa siyang harapin ang mga takot sa loob at labas ng paaralan pagkatapos maiugnay ang kanyang sarili sa kwento nina Malakas at Maganda. Nirerekomenda na patuloy na suportahan ang kanyang inisyatibo na lumabas sa comfort zone, at tutukan sa susunod na pagkikita ang pagbuo pa ng tiwala sa sarili (self-esteem building) upang ganap na mabawasan ang mga natitirang epekto ng cognitive distortions.";
  }
}
