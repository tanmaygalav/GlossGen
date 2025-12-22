import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { type AnalysisResult, type ProfileAnalysisResult, type LanguageDistribution, type RepoInfo, type Badge, type ContributionDay } from '../types';

// Access environment variables
const GITHUB_TOKEN = process.env.VITE_GITHUB_TOKEN || ''; 
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

/**
 * Helper to generate consistent headers for GitHub API calls.
 */
const getGithubHeaders = () => {
    const headers: HeadersInit = {
        'Accept': 'application/vnd.github+json',
    };
    if (GITHUB_TOKEN) {
        headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`;
    }
    return headers;
};

function b64Decode(str: string): string {
    try {
        const binaryString = atob(str);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return new TextDecoder().decode(bytes);
    } catch (e) {
        console.error("Failed to decode base64 string:", e);
        return ""; 
    }
}

const selectRepresentativeFiles = (files: { path: string; type: string }[]): string[] => {
    const SOURCE_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.py', '.go', '.rs', '.java', '.rb', '.php', 'vue', 'svelte'];
    const EXCLUDED_DIRS = ['node_modules', 'dist', 'build', 'vendor', 'test', 'tests', 'docs', 'examples', '.github', 'assets'];
    
    const isSourceFile = (path: string) => SOURCE_EXTENSIONS.some(ext => path.endsWith(ext) && !path.endsWith(`.min${ext}`));
    const isNotExcluded = (path: string) => !EXCLUDED_DIRS.some(dir => path.includes(`/${dir}/`) || path.startsWith(`${dir}/`));
    
    return files
        .filter(file => file.type === 'blob' && isSourceFile(file.path) && isNotExcluded(file.path))
        .map(file => file.path)
        .slice(0, 5); 
};


export const analyzeRepo = async (repoUrl: string): Promise<AnalysisResult> => {
    let owner: string, repo: string;
    try {
        const url = new URL(repoUrl);
        if (url.hostname !== 'github.com') throw new Error();
        const pathParts = url.pathname.split('/').filter(Boolean);
        if (pathParts.length < 2) throw new Error();
        [owner, repo] = pathParts;
    } catch (error) {
        throw new Error('Invalid GitHub repository URL.');
    }

    // 1. Fetch Repository Data (GitHub)
    const repoDetailsRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers: getGithubHeaders() });
    
    if (!repoDetailsRes.ok) {
        if (repoDetailsRes.status === 403) throw new Error("GitHub Rate Limit Exceeded. Please check your GitHub Token.");
        if (repoDetailsRes.status === 404) throw new Error("Repository not found.");
        throw new Error(`GitHub API Error: ${repoDetailsRes.status}`);
    }
    const repoDetails = await repoDetailsRes.json();
    const defaultBranch = repoDetails.default_branch;

    let commitCount = 0;
    try {
        const commitsRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=1`, { headers: getGithubHeaders() });
        if (commitsRes.ok) {
            const linkHeader = commitsRes.headers.get('Link');
            if (linkHeader) {
                const match = linkHeader.match(/[?&]page=(\d+)>; rel="last"/);
                if (match) commitCount = parseInt(match[1], 10);
            }
            if (commitCount === 0) {
                 const data = await commitsRes.json();
                 if (Array.isArray(data)) commitCount = data.length;
            }
        }
    } catch (e) { console.error(e); }

    const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`, { headers: getGithubHeaders() });
    if (!treeRes.ok) throw new Error(`Failed to fetch file tree.`);
    const treeData = await treeRes.json();
    const representativeFilePaths = selectRepresentativeFiles(treeData.tree || []);

    const fileContents = await Promise.all(
        representativeFilePaths.map(async (path) => {
            const contentRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, { headers: getGithubHeaders() });
            if (!contentRes.ok) return { path, content: "" };
            const data = await contentRes.json();
            return { path, content: b64Decode(data.content || '') };
        })
    );

    // 2. AI Analysis (Using standard @google/generative-ai)
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        systemInstruction: "You are an expert code analyst. Analyze the provided code and return a JSON object."
    });

    const prompt = `
        Analyze this repo: ${owner}/${repo}.
        Files: ${representativeFilePaths.join(', ')}
        
        Code Content:
        ${fileContents.map(f => `// ${f.path}\n${f.content.slice(0, 2000)}`).join('\n\n')}

        Return a JSON object with:
        - techStack (string array)
        - fileStructureSummary (string)
        - starRating (number 1-5)
        - items (array of {name, type, path})
    `;
    
    const schema = {
        type: SchemaType.OBJECT,
        properties: {
            techStack: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
            fileStructureSummary: { type: SchemaType.STRING },
            starRating: { type: SchemaType.NUMBER },
            items: {
                type: SchemaType.ARRAY,
                items: {
                    type: SchemaType.OBJECT,
                    properties: {
                        name: { type: SchemaType.STRING },
                        type: { type: SchemaType.STRING, enum: ['Function', 'Class', 'Variable'] },
                        path: { type: SchemaType.STRING },
                    },
                    required: ['name', 'type', 'path'],
                },
            },
        },
        required: ['techStack', 'fileStructureSummary', 'starRating', 'items'],
    };

    try {
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: schema,
            },
        });

        const analysis = JSON.parse(result.response.text());

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
        throw new Error("AI analysis failed. Please check your API key.");
    }
};

const ALL_BADGES: Omit<Badge, 'earned'>[] = [
    { id: 'POLYGLOT', name: 'Polyglot', description: 'Use 5+ languages.' },
    { id: 'STAR_GAZER', name: 'Star Gazer', description: 'Repo with 100+ stars.' },
    { id: 'COMMIT_MACHINE', name: 'Commit Machine', description: '500+ commits.' },
    { id: 'PERFECT_README', name: 'Perfect Readme', description: 'Quality score 90+.' },
    { id: 'COMMUNITY_BUILDER', name: 'Community Builder', description: '25+ forks.' },
    { id: 'TOP_10_PERCENT', name: 'Top 10%', description: 'Health score 90+.' },
];

export const analyzeProfile = async (profileUrl: string): Promise<ProfileAnalysisResult> => {
    let username: string;
    try {
        const url = new URL(profileUrl);
        username = url.pathname.split('/').filter(Boolean)[0];
        if (!username) throw new Error();
    } catch {
        throw new Error('Invalid profile URL.');
    }

    const userRes = await fetch(`https://api.github.com/users/${username}`, { headers: getGithubHeaders() });
    if (!userRes.ok) throw new Error("User not found or Rate Limit exceeded.");
    const user = await userRes.json();

    const reposRes = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=pushed`, { headers: getGithubHeaders() });
    const repos = await reposRes.json();
    const publicRepos = Array.isArray(repos) ? repos.filter((r: any) => !r.fork) : [];

    // Contribution data (mock/external)
    let contributionData: ContributionDay[] = [];
    try {
        const contribRes = await fetch(`https://github-contributions-api.jogruber.de/v4/${username}?y=last`);
        if (contribRes.ok) {
            const data = await contribRes.json();
            contributionData = data.contributions || [];
        }
    } catch (e) { console.warn("Contrib fetch failed"); }

    // Prepare data for AI
    let totalStars = 0;
    const languageDistribution: LanguageDistribution = {};
    publicRepos.forEach((repo: any) => {
        totalStars += repo.stargazers_count;
        if (repo.language) languageDistribution[repo.language] = (languageDistribution[repo.language] || 0) + 1;
    });

    const topReposPreAnalysis = [...publicRepos]
        .sort((a: any, b: any) => b.stargazers_count - a.stargazers_count)
        .slice(0, 10)
        .map((repo: any) => ({
            name: repo.full_name,
            description: repo.description,
            stars: repo.stargazers_count,
            language: repo.language,
            url: repo.html_url
        }));

    // AI Analysis (Using standard @google/generative-ai)
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        systemInstruction: "You are a friendly career coach for developers."
    });

    const prompt = `
        Analyze profile: ${username}. Bio: ${user.bio}.
        Top Repos: ${JSON.stringify(topReposPreAnalysis)}
        Languages: ${JSON.stringify(languageDistribution)}
        
        Return JSON with:
        - profileSummary (string)
        - starRating (number 1-5)
        - mainExpertise (string array)
        - healthScore (number 0-100)
        - suggestions (string array)
        - topRepos (array of {name, pitch, qualityScore})
    `;

    const schema = {
        type: SchemaType.OBJECT,
        properties: {
            profileSummary: { type: SchemaType.STRING },
            starRating: { type: SchemaType.NUMBER },
            mainExpertise: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
            healthScore: { type: SchemaType.NUMBER },
            suggestions: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
            topRepos: {
                type: SchemaType.ARRAY,
                items: {
                    type: SchemaType.OBJECT,
                    properties: {
                        name: { type: SchemaType.STRING },
                        pitch: { type: SchemaType.STRING },
                        qualityScore: { type: SchemaType.NUMBER },
                    },
                    required: ['name', 'pitch', 'qualityScore'],
                }
            }
        },
        required: ['profileSummary', 'starRating', 'mainExpertise', 'healthScore', 'suggestions', 'topRepos'],
    };

    try {
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: schema,
            },
        });

        const analysis = JSON.parse(result.response.text());

        // Merge results
        const topRepos: RepoInfo[] = topReposPreAnalysis.map(repo => {
            const aiData = analysis.topRepos?.find((r: any) => r.name === repo.name);
            return {
                ...repo,
                pitch: aiData?.pitch || 'Cool project',
                qualityScore: aiData?.qualityScore || 80,
            };
        });

        // Badges Logic
        const earnedBadges = ALL_BADGES.map(badge => {
            let earned = false;
            if (badge.id === 'POLYGLOT' && Object.keys(languageDistribution).length >= 5) earned = true;
            if (badge.id === 'STAR_GAZER' && publicRepos.some((r: any) => r.stargazers_count >= 100)) earned = true;
            if (badge.id === 'COMMIT_MACHINE' && contributionData.reduce((acc, d) => acc + d.count, 0) > 500) earned = true;
            if (badge.id === 'PERFECT_README' && topRepos.some(r => r.qualityScore >= 90)) earned = true;
            if (badge.id === 'COMMUNITY_BUILDER' && publicRepos.some((r: any) => r.forks_count >= 25)) earned = true;
            if (badge.id === 'TOP_10_PERCENT' && analysis.healthScore >= 90) earned = true;
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
            profileSummary: analysis.profileSummary || "No summary",
            starRating: analysis.starRating || 0,
            mainExpertise: analysis.mainExpertise || [],
            healthScore: analysis.healthScore || 50,
            badges: earnedBadges,
            suggestions: analysis.suggestions || [],
            contributionData,
        };

    } catch (err) {
        console.error("Gemini API Error:", err);
        throw new Error("AI analysis failed. Please check your API key.");
    }
};
