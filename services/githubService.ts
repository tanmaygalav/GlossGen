import { GoogleGenAI, Type } from "@google/genai";
import { type AnalysisResult } from '../types';

// Helper to decode base64 content from GitHub API
function b64Decode(str: string): string {
    try {
        // Use TextDecoder for robust UTF-8 decoding
        const binaryString = atob(str);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return new TextDecoder().decode(bytes);
    } catch (e) {
        console.error("Failed to decode base64 string:", e);
        return ""; // Return empty string on failure
    }
}

// Selects a representative subset of files for analysis to keep the prompt efficient
const selectRepresentativeFiles = (files: { path: string; type: string }[]): string[] => {
    const SOURCE_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.py', '.go', '.rs', '.java', '.rb', '.php', 'vue', 'svelte'];
    const EXCLUDED_DIRS = ['node_modules', 'dist', 'build', 'vendor', 'test', 'tests', 'docs', 'examples', '.github', 'assets'];
    
    const isSourceFile = (path: string) => SOURCE_EXTENSIONS.some(ext => path.endsWith(ext) && !path.endsWith(`.min${ext}`));
    const isNotExcluded = (path: string) => !EXCLUDED_DIRS.some(dir => path.includes(`/${dir}/`) || path.startsWith(`${dir}/`));
    
    return files
        .filter(file => file.type === 'blob' && isSourceFile(file.path) && isNotExcluded(file.path))
        .map(file => file.path)
        .slice(0, 15); // Limit to a reasonable number of files
};


export const analyzeRepo = async (repoUrl: string): Promise<AnalysisResult> => {
    // 1. Parse Owner and Repo from GitHub URL
    let owner: string, repo: string;
    try {
        const url = new URL(repoUrl);
        if (url.hostname !== 'github.com') {
            throw new Error('Invalid GitHub URL. Hostname must be github.com.');
        }
        const pathParts = url.pathname.split('/').filter(Boolean);
        if (pathParts.length < 2) {
            throw new Error('Invalid repository path in URL.');
        }
        [owner, repo] = pathParts;
    } catch (error) {
        throw new Error('Invalid URL format. Please enter a valid GitHub repository URL.');
    }

    // 2. Fetch Repository Data from GitHub API
    const repoDetailsRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
    if (!repoDetailsRes.ok) {
        if (repoDetailsRes.status === 404) throw new Error("Repository not found. Check the URL or if it's a private repository.");
        throw new Error(`Failed to fetch repository details. GitHub API status: ${repoDetailsRes.status}`);
    }
    const repoDetails = await repoDetailsRes.json();
    const defaultBranch = repoDetails.default_branch;

    const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`);
     if (!treeRes.ok) throw new Error(`Failed to fetch repository file tree. GitHub API status: ${treeRes.status}`);
    const treeData = await treeRes.json();
    
    if (treeData.truncated) {
        console.warn("File tree is truncated by the GitHub API; analysis may be based on a partial file list.");
    }
    const allFiles: { path: string; type: string }[] = treeData.tree;
    const representativeFilePaths = selectRepresentativeFiles(allFiles);

    if (representativeFilePaths.length === 0) {
        throw new Error("Could not find any representative source code files to analyze in this repository.");
    }

    const fileContents = await Promise.all(
        representativeFilePaths.map(async (path) => {
            const contentRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`);
            if (!contentRes.ok) return { path, content: `// Error fetching content for ${path}` };
            const data = await contentRes.json();
            return { path, content: b64Decode(data.content || '') };
        })
    );

    // 3. Perform Analysis with the Gemini API
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `
        You are an expert code analyst. I will provide you with the file structure and the content of several key source files from a GitHub repository. Your task is to analyze this information and return a comprehensive summary in JSON format.

        Repository: ${owner}/${repo}
        
        File list of the entire repository (this list might be truncated):
        ${allFiles.map(f => f.path).slice(0, 300).join('\n')}

        Content of selected source files:
        ${fileContents.map(f => `// FILE: ${f.path}\n\n${f.content}`).join('\n\n---\n\n')}

        Based on all the provided information, generate a JSON object that strictly follows the schema I provide.
        
        Your analysis should include:
        - techStack: Identify the main languages, frameworks, and significant libraries.
        - fileStructureSummary: A concise, one-paragraph summary of the repository's architecture.
        - commitCount: Provide a reasonable *estimate* of the total commit count based on the repository's size, complexity, and apparent maturity.
        - starRating: A rating from 1.0 to 5.0, assessing the code's quality, clarity, and organization from the samples provided.
        - items: A glossary of up to 20 of the most important and representative functions, classes, or variables from the provided code.
    `;
    
    const schema = {
      type: Type.OBJECT,
      properties: {
        techStack: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of technologies used." },
        fileStructureSummary: { type: Type.STRING, description: "A summary of the file structure." },
        commitCount: { type: Type.INTEGER, description: "Estimated number of commits." },
        starRating: { type: Type.NUMBER, description: "A quality rating from 1.0 to 5.0." },
        items: {
          type: Type.ARRAY,
          description: "A glossary of key code items.",
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              type: { type: Type.STRING, enum: ['Function', 'Class', 'Variable'] },
              path: { type: Type.STRING },
            },
            required: ['name', 'type', 'path'],
          },
        },
      },
      required: ['techStack', 'fileStructureSummary', 'commitCount', 'starRating', 'items'],
    };

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            },
        });

        const analysis = JSON.parse(response.text);

        // Combine GitHub data with Gemini's analysis
        return {
            repoName: repoDetails.full_name,
            items: analysis.items || [],
            techStack: analysis.techStack || [],
            fileStructureSummary: analysis.fileStructureSummary || 'No summary generated.',
            commitCount: analysis.commitCount || 0,
            starRating: analysis.starRating || 0,
        };

    } catch (err) {
        console.error("Gemini API Error:", err);
        throw new Error("Failed to analyze the repository. The AI model may be temporarily unavailable or returned an unexpected response.");
    }
};
