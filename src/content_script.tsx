import { GET_BLACKLIST } from "./constant";
import { loadUserPreferences, onPreferencesChanged, getDefaultPreferences } from "./preferences";
import { Filters } from "./types";


let currentFilters: Filters = getDefaultPreferences().filters;

let channelsBlacklist: Set<string> = new Set();
let forbiddenWords: Set<string> = new Set();
let softWords: Set<string> = new Set();
let forbiddenComments: Set<RegExp> = new Set();
let forbidenWordInChannel: Set<string> = new Set();
const processedNodes = new WeakSet<Node>();

// Set of forbidden Unicode characters often used for spam or obfuscation
const forbiddenChars = new Set([
    "\u0336", // Combining Long Stroke Overlay (strikethrough)
    "\u200E", // Left-to-Right Mark (LRM)
    "\u200F", // Right-to-Left Mark (RLM)
    "\u202C", // Pop Directional Formatting (PDF)
    "\u202D", // Left-to-Right Override (LRO)
    "\u202E", // Right-to-Left Override (RLO)
    "\u202F", // Narrow No-Break Space (NNBSP)
    "\u2066", // Left-to-Right Isolate (LRI)
    "\u2067", // Right-to-Left Isolate (RLI)
    "\u2068", // First Strong Isolate (FSI)
    "\u2069"  // Pop Directional Isolate (PDI)
]);

async function loadData(): Promise<void> {
    const compiled = await new Promise<any>(resolve => {
        chrome.runtime.sendMessage({ type: GET_BLACKLIST }, (response: any) => resolve(response));
    });

    if (!compiled) {
        return;
    }

    channelsBlacklist = new Set(compiled.channels);
    forbiddenWords = new Set(compiled.words);
    softWords = new Set(compiled.softWords);
    forbiddenComments = new Set(compiled.regex.map((r: string) => new RegExp(r, 'i')));
    forbidenWordInChannel = new Set(compiled.forbidenWordInChannel);


}

function hideSpamNode(node: Element): void {
    (node as HTMLElement).style.display = 'none';
}

function processCommentNode(node: Node): void {
    if (!(node instanceof HTMLElement)) return;
    if (processedNodes.has(node)) return;

    const comment = node.closest('ytd-comment-view-model') || node.querySelector?.('ytd-comment-view-model');
    if (!comment) return;

    const authorSpan = comment.querySelector('#author-text span');
    const commentText = comment.querySelector('#content-text');
    if (!authorSpan || !commentText) return;

    const commentTextContent = commentText.textContent?.trim() || '';

    if (currentFilters.charactersFilter) {
        for (const char of forbiddenChars) {
            if (commentTextContent.includes(char)) {
                hideSpamNode(comment);
                processedNodes.add(node);
                return;
            }
        }
    }

    const authorName = authorSpan.textContent?.trim().toLowerCase() || '';
    if (currentFilters.blockedChannels && channelsBlacklist.has(authorName)) {
        hideSpamNode(comment);
        processedNodes.add(node);
        return;
    }

    const lowerComment = commentTextContent.toLowerCase();

    // Allow comments containing tolerated words if enabled
    if (currentFilters.filterSoftWordsInComment) {
        for (const word of softWords) {
            if (lowerComment.includes(word)) {
                hideSpamNode(comment);
                processedNodes.add(node);
                return;
            }
        }
    }
    if (currentFilters.forbiddenWordsInComment) {
        for (const word of forbiddenWords) {
            if (lowerComment.includes(word)) {
                hideSpamNode(comment);
                processedNodes.add(node);
                return;
            }
        }
    }

    if (currentFilters.forbiddenWordsInChannelName) {
        for (const word of forbidenWordInChannel) {
            if (authorName.includes(word)) {
                hideSpamNode(comment);
                processedNodes.add(node);
                return;
            }
        }
    }

    if (currentFilters.forbiddenCommentPatterns) {
        for (const regex of forbiddenComments) {
            if (regex.test(lowerComment)) {
                hideSpamNode(comment);
                processedNodes.add(node);
                return;
            }
        }
    }

    processedNodes.add(node);
}

function observeComments(): void {
    let pendingNodes: Node[] = [];
    let timeoutId: number | undefined;

    const observer = new MutationObserver(mutations => {
        for (const mutation of mutations) {
            pendingNodes.push(...mutation.addedNodes);
        }

        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = window.setTimeout(() => {
            for (const node of pendingNodes) {
                processCommentNode(node);
            }
            pendingNodes = [];
        }, 100);
    });

    observer.observe(document.body, { childList: true, subtree: true });
}

function hideExistingComments(): void {
    const comments = document.querySelectorAll('ytd-comment-thread-renderer');
    comments.forEach(comment => processCommentNode(comment));
}

async function waitForCommentsSection(): Promise<void> {
    return new Promise(resolve => {
        const observer = new MutationObserver((mutations, obs) => {
            if (document.querySelector('ytd-comment-thread-renderer')) {
                obs.disconnect();
                resolve();
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    });
}

function observePageChanges(): void {
    const bodyObserver = new MutationObserver(() => {
        hideExistingComments();
    });
    bodyObserver.observe(document.body, { childList: true, subtree: true });
}

async function main(): Promise<void> {
    const prefs = await loadUserPreferences();
    currentFilters = prefs.filters;
    onPreferencesChanged((newPrefs) => {
        currentFilters = newPrefs.filters;
        hideExistingComments();
    });
    await loadData();
    await waitForCommentsSection();
    hideExistingComments();
    observeComments();
    observePageChanges();
}

main();
