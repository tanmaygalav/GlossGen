// src/aiEngine.ts
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

// Automatically grabs process.env.GEMINI_API_KEY from environment state
const ai = new GoogleGenAI({});

// Rule 3.4: Define the strict evaluation behavior profile for the reviewer bot
const SYSTEM_INSTRUCTION = `
You are an expert Senior Software Engineer and automated security auditor. 
Your job is to review raw pull request Git diff blocks.

CRITICAL INSTRUCTIONS:
1. Provide ZERO conversational filler. Do not say "Sure, I can help with that" or "Here is my review". 
2. Only flag verified, actionable engineering issues. If a file looks excellent, return absolutely nothing for that file.
3. For found issues, you must output your review using the exact markdown template block below:

### 📂 File: [Insert File Path]
- **Line Number**: [Insert Approximate Line Number or range]
- **Category**: [Security Vulnerabilities | Performance Pitfalls | Bugs/Syntax Edge Cases]
- **Problem**: [Clear explanation of why this code pattern is dangerous or inefficient]
- **Suggested Fix**: 
\`\`\`[language]
[Insert corrected code snippet block]
\`\`\`
---

Look specifically for:
- Security issues (SQL Injection, hardcoded credentials, exposed vectors)
- Performance traps (O(n^2) nested maps, un-subscriptions needed in React hooks/useEffect)
- Edge case syntax breakdowns (unhandled null pointers, missing try/catch wrappers in async tasks)
`;

interface CodeFilePayload {
  fileName: string;
  diffContent: string;
}

/**
 * Sends a structured code diff to Gemini 2.5 Flash and returns line-by-line review insights.
 */
export async function analyzeCodeDiff(files: CodeFilePayload[]): Promise<string> {
  if (files.length === 0) return 'No reviewable code changes detected.';

  // Build the review payload by joining file titles with their respective git diff text blocks
  const formattedPromptContext = files
    .map(file => `### FILE PATH: ${file.fileName}\n\`\`\`diff\n${file.diffContent}\n\`\`\``)
    .join('\n\n');

  try {
    console.log(`🤖 [AI Engine] Dispatching code chunks to Gemini 2.5 Flash...`);
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Please perform a code review on the following code diff:\n\n${formattedPromptContext}`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.2 // Lower temperature minimizes hallucinations and guarantees rigorous code checks
      }
    });

    return response.text || '✨ AI automated review generated zero critical code flags.';
    
  } catch (error: any) {
    console.error(`🚨 [AI Engine] Primary LLM Provider Error: ${error.message}`);
    
    // Rule 3.2: Fallback trigger pathway can hook here if secondary network credentials exist
    throw error;
  }
}