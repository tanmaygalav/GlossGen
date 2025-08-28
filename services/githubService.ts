import { GoogleGenAI, Type } from "@google/genai";
import { type AnalysisResult, type ProfileAnalysisResult, type LanguageDistribution, type RepoInfo, type Badge } from '../types';

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

    // Fetch real commit count from GitHub API
    let commitCount = 0;
    try {
        const commitsRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=1`);
        if (commitsRes.ok) {
            const linkHeader = commitsRes.headers.get('Link');
            let countFromHeader = 0;
            if (linkHeader) {
                const lastLink = linkHeader.split(',').find(s => s.includes('rel="last"'));
                if (lastLink) {
                    const match = lastLink.match(/[?&]page=(\d+)/);
                    if (match) {
                        countFromHeader = parseInt(match[1], 10);
                    }
                }
            }

            if (countFromHeader > 0) {
                commitCount = countFromHeader;
            } else {
                 // No header or parsing failed; must be 0 or 1 commits.
                 const commitsData = await commitsRes.json();
                 if (Array.isArray(commitsData)) {
                     commitCount = commitsData.length;
                 }
            }
        }
    } catch (e) {
        console.error("Failed to fetch commit count from GitHub API, it will be 0.", e);
        // commitCount will remain 0
    }

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
    const ai = new GoogleGenAI({ apiKey: import.meta.env.API_KEY });

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
        - starRating: A rating from 1.0 to 5.0, assessing the code's quality, clarity, and organization from the samples provided.
        - items: A glossary of up to 20 of the most important and representative functions, classes, or variables from the provided code.
    `;
    
    const schema = {
      type: Type.OBJECT,
      properties: {
        techStack: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of technologies used." },
        fileStructureSummary: { type: Type.STRING, description: "A summary of the file structure." },
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
      required: ['techStack', 'fileStructureSummary', 'starRating', 'items'],
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
            commitCount: commitCount,
            starRating: analysis.starRating || 0,
        };

    } catch (err) {
        console.error("Gemini API Error:", err);
        throw new Error("Failed to analyze the repository. The AI model may be temporarily unavailable or returned an unexpected response.");
    }
};

const ALL_BADGES: Omit<Badge, 'earned'>[] = [
    { id: 'POLYGLOT', name: 'Polyglot', description: 'Use 5 or more distinct languages in public repositories.' },
    { id: 'STAR_GAZER', name: 'Star Gazer', description: 'Own a repository with 100+ stars.' },
    { id: 'COMMIT_MACHINE', name: 'Commit Machine', description: 'Make over 500 commits in the last year.' },
    { id: 'PERFECT_README', name: 'Perfect Readme', description: 'Have at least one repository with an AI-rated quality score of 90+.' },
    { id: 'COMMUNITY_BUILDER', name: 'Community Builder', description: 'Own a repository with 25+ forks.' },
    { id: 'TOP_10_PERCENT', name: 'Top 10%', description: 'Have a profile health score of 90 or higher.' },
];


export const analyzeProfile = async (profileUrl: string): Promise<ProfileAnalysisResult> => {
    // 1. Parse Username from GitHub URL
    let username: string;
    try {
        const url = new URL(profileUrl);
        if (url.hostname !== 'github.com') {
            throw new Error('Invalid GitHub URL. Hostname must be github.com.');
        }
        const pathParts = url.pathname.split('/').filter(Boolean);
        if (pathParts.length < 1) {
            throw new Error('Invalid profile path in URL.');
        }
        [username] = pathParts;
    } catch (error) {
        throw new Error('Invalid URL format. Please enter a valid GitHub profile URL.');
    }

    // 2. Fetch User and Repository Data from GitHub API
    const userRes = await fetch(`https://api.github.com/users/${username}`);
    if (!userRes.ok) {
        if (userRes.status === 404) throw new Error("User not found. Check the username.");
        throw new Error(`Failed to fetch user details. GitHub API status: ${userRes.status}`);
    }
    const user = await userRes.json();

    const reposRes = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=pushed`);
    if (!reposRes.ok) throw new Error(`Failed to fetch repositories. GitHub API status: ${reposRes.status}`);
    const repos = (await reposRes.json()).filter((r: any) => !r.fork); // Exclude forks

    // 3. Process GitHub Data
    let totalStars = 0;
    const languageDistribution: LanguageDistribution = {};

    for (const repo of repos) {
        totalStars += repo.stargazers_count;
        if (repo.language) {
            languageDistribution[repo.language] = (languageDistribution[repo.language] || 0) + 1;
        }
    }

    const topReposPreAnalysis = [...repos]
        .sort((a, b) => b.stargazers_count - a.stargazers_count)
        .slice(0, 10)
        .map((repo: any) => ({
            name: repo.full_name,
            description: repo.description,
            stars: repo.stargazers_count,
            language: repo.language,
            url: repo.html_url
        }));

    // 4. Perform Analysis with the Gemini API
    const ai = new GoogleGenAI({ apiKey: import.meta.env.API_KEY });
    
    const systemInstruction = "You are a friendly and professional career coach for software developers. Your analysis should be encouraging, insightful, and provide actionable advice. When generating summaries and suggestions, use a positive and supportive tone. When scoring, be objective and fair based on the data provided.";

    const prompt = `
        Analyze the following GitHub profile data and provide a comprehensive summary, including gamification elements, adhering strictly to the provided JSON schema.

        User Profile:
        - Username: ${user.login}
        - Name: ${user.name}
        - Bio: ${user.bio}
        - Followers: ${user.followers}
        - Public Repos: ${user.public_repos}
        - Member Since: ${user.created_at}

        Top Repositories (by stars):
        ${topReposPreAnalysis.map(r => `- ${r.name} (Stars: ${r.stars}, Language: ${r.language}): ${r.description}`).join('\n')}

        Language Distribution (by count of repositories):
        ${JSON.stringify(languageDistribution, null, 2)}

        Based on all the provided information, generate a JSON object that strictly follows the schema I provide.

        Your analysis should include:
        - profileSummary: A concise, one-paragraph summary of the developer's profile. Mention their apparent interests, activity level, and the types of projects they work on.
        - starRating: A rating from 1.0 to 5.0, assessing the overall quality and impact of the profile based on the provided data.
        - mainExpertise: A list of 2-4 key areas of expertise (e.g., "Frontend Development", "React", "Data Science", "Go").
        - healthScore: A score from 0 to 100 for the profile's "health". Base this on a holistic view of:
            1. Profile Completeness (20% weight): Presence and quality of name, bio, avatar.
            2. Repository Quality (40% weight): Number of repos, use of descriptions, star count, code quality reflected in top repos.
            3. Activity & Consistency (20% weight): Number of public repos, recency of pushes (inferred from sorted repo list).
            4. Community Engagement (20% weight): Number of followers and total stars.
        - suggestions: A list of 2-3 actionable tips for how this developer could improve their GitHub profile.
        - topRepos (updated): For each of the top repositories provided, add a 'pitch' (a compelling one-liner describing the project's purpose) and a 'qualityScore' (a 1-100 score based on its description, language, and stars).
    `;

    const schema = {
        type: Type.OBJECT,
        properties: {
            profileSummary: { type: Type.STRING },
            starRating: { type: Type.NUMBER },
            mainExpertise: { type: Type.ARRAY, items: { type: Type.STRING } },
            healthScore: { type: Type.NUMBER },
            suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            topRepos: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        pitch: { type: Type.STRING },
                        qualityScore: { type: Type.NUMBER },
                    },
                    required: ['name', 'pitch', 'qualityScore'],
                }
            }
        },
        required: ['profileSummary', 'starRating', 'mainExpertise', 'healthScore', 'suggestions', 'topRepos'],
    };

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: schema,
            },
        });

        const analysis = JSON.parse(response.text);

        // Merge AI analysis back into topRepos data
        const topRepos: RepoInfo[] = topReposPreAnalysis.map(repo => {
            const aiRepoData = analysis.topRepos.find((r: any) => r.name === repo.name);
            return {
                ...repo,
                pitch: aiRepoData?.pitch || 'An interesting project.',
                qualityScore: aiRepoData?.qualityScore || 60,
            };
        });

        // Calculate badges
        const earnedBadges: Badge[] = ALL_BADGES.map(badge => {
            let earned = false;
            switch(badge.id) {
                case 'POLYGLOT':
                    if (Object.keys(languageDistribution).length >= 5) earned = true;
                    break;
                case 'STAR_GAZER':
                    if (repos.some((r:any) => r.stargazers_count >= 100)) earned = true;
                    break;
                case 'COMMIT_MACHINE':
                    // This is a placeholder as we don't fetch detailed commit history.
                    // In a real app, you'd use the GraphQL API to get contributions.
                    if (user.public_repos > 50) earned = true; // Simple proxy
                    break;
                case 'PERFECT_README':
                    if (topRepos.some(r => r.qualityScore >= 90)) earned = true;
                    break;
                case 'COMMUNITY_BUILDER':
                    if (repos.some((r:any) => r.forks_count >= 25)) earned = true;
                    break;
                case 'TOP_10_PERCENT':
                    if (analysis.healthScore >= 90) earned = true;
                    break;
            }
            return { ...badge, earned };
        });

        return {
            login: user.login,
            name: user.name,
            avatarUrl: user.avatar_url,
            bio: user.bio,
            followers: user.followers,
            following: user.following,
            publicRepoCount: user.public_repos,
            createdAt: user.created_at,
            totalStars,
            topRepos,
            languageDistribution,
            profileSummary: analysis.profileSummary || 'No summary generated.',
            starRating: analysis.starRating || 0,
            mainExpertise: analysis.mainExpertise || [],
            healthScore: analysis.healthScore || 0,
            badges: earnedBadges,
            suggestions: analysis.suggestions || [],
        };

    } catch (err) {
        console.error("Gemini API Error:", err);
        throw new Error("Failed to analyze the profile. The AI model may be temporarily unavailable or returned an unexpected response.");
    }
};
