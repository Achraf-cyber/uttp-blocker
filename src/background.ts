import { getBlacklist  } from './background_loader';
import { GET_BLACKLIST } from './constant';

const REFRESH_FREQUENCY = 120;

// Send JSON-safe compiled blacklist to content scripts
async function getCompiledBlacklistForContent() {
    const compiled = await getBlacklist();
    if (!compiled) return null;

    return {
        channels: Array.from(compiled.channels),
        words: Array.from(compiled.words),
        regex: compiled.regex.map(r => r.source)
    };
}


// Listen for content script requests
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === GET_BLACKLIST) {
        getCompiledBlacklistForContent().then(config => sendResponse(config));
        return true;
    }
});


chrome.alarms.create("refreshBlacklist", { periodInMinutes: REFRESH_FREQUENCY });
chrome.alarms.onAlarm.addListener(alarm => {
    if (alarm.name === "refreshBlacklist") {
        getBlacklist();
    }
});

// Initial fetch on install
chrome.runtime.onInstalled.addListener(() => {
    getBlacklist(true);
});

