import type { BlacklistConfig, CompiledBlacklist } from './types';

const GITHUB_JSON_URL = "https://achraf-cyber.github.io/extension/uttp_blocker/uttp_signature.json";
const CACHE_EXPIRATION = 24 * 60 * 60 * 1000; // 24 hours

// Fetch JSON from GitHub with timeout
async function fetchBlacklist(timeout = 5000): Promise<BlacklistConfig | null> {
    try {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(GITHUB_JSON_URL, { signal: controller.signal });
        clearTimeout(id);

        if (!response.ok) throw new Error(`Failed to fetch JSON: ${response.statusText}`);

        const data: BlacklistConfig = await response.json();

        if (!Array.isArray(data.channelsBlackList) ||
            !Array.isArray(data.forbiddenWord) ||
            !Array.isArray(data.forgivableWords) ||
            !Array.isArray(data.forbidenWordInChannel) ||
            !Array.isArray(data.forbiddenComments)) {
            throw new Error("Invalid JSON structure");
        }

        return data;
    } catch (error) {
        console.error("Error loading blacklist");
        return null;
    }
}

// Load blacklist from cache or GitHub
export async function loadBlacklist(forceRefetch: boolean = false): Promise<BlacklistConfig | null> {
    const stored = await chrome.storage.local.get(["blacklist", "lastUpdate"]);
    const now = Date.now();
    const lastUpdate = stored.lastUpdate ?? 0;

    if (!forceRefetch && stored.blacklist && now - lastUpdate < CACHE_EXPIRATION) {
        return stored.blacklist as BlacklistConfig;
    }

    const fresh = await fetchBlacklist();
    if (fresh) {
        await chrome.storage.local.set({
            blacklist: fresh,
            lastUpdate: now
        });
        return fresh;
    }

    return stored.blacklist ?? null;
}

// Compile blacklist for internal use
export function compileBlacklist(config: BlacklistConfig): CompiledBlacklist {
    return {
        channels: new Set(config.channelsBlackList.map(c => c.toLowerCase())),
        words: new Set(config.forbiddenWord.map((w : string) => w.toLowerCase())),
        softWords: new Set(config.forgivableWords.map((w: string) => w.toLowerCase())),
        forbidenWordInChannel: new Set(config.forbidenWordInChannel.map((w: string) => w.toLowerCase())),
        regex: config.forbiddenComments.filter((s: string) => s.trim() != "").map(pattern => {
            try {
                return new RegExp(pattern, "i");
            } catch {
                return /^$/;
            }
        })
    };
}

// Helper to get compiled blacklist
export async function getBlacklist(forceRefetch: boolean = false): Promise<CompiledBlacklist | null> {
    const config = await loadBlacklist(forceRefetch);
    return config ? compileBlacklist(config) : null;
}
