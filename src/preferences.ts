import { UserPreferences } from "./types";

// Default preferences if nothing is stored yet
export function getDefaultPreferences(): UserPreferences {
  return {
    filters: {
      charactersFilter: true,
      blockedChannels: true,
      forbiddenWordsInChannelName: true,
      forbiddenWordsInComment: true,
      filterSoftWordsInComment: true,
      forbiddenCommentPatterns: true,
    },
  };
}

// Merge defaults with loaded preferences (useful after extension updates)
function mergeWithDefaults(prefs: Partial<UserPreferences>): UserPreferences {
  const defaults = getDefaultPreferences();
  return {
    ...defaults,
    ...prefs,
    filters: {
      ...defaults.filters,
      ...(prefs.filters || {}),
    },
  };
}

// Load preferences from chrome.storage.sync
export async function loadUserPreferences(): Promise<UserPreferences> {
  return new Promise((resolve) => {
    chrome.storage.sync.get("userPreferences", (result) => {
      if (result.userPreferences) {
        resolve(mergeWithDefaults(result.userPreferences as Partial<UserPreferences>));
      } else {
        resolve(getDefaultPreferences());
      }
    });
  });
}

// Save preferences to chrome.storage.sync
export function saveUserPreferences(prefs: UserPreferences): void {
  chrome.storage.sync.set({ userPreferences: prefs });
}

// Listen for preference changes
export function onPreferencesChanged(
  callback: (newPrefs: UserPreferences, oldPrefs?: UserPreferences) => void
): void {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "sync" && changes.userPreferences) {
      const { newValue, oldValue } = changes.userPreferences as {
        newValue: UserPreferences;
        oldValue?: UserPreferences;
      };
      callback(mergeWithDefaults(newValue), oldValue ? mergeWithDefaults(oldValue) : undefined);
    }
  });
}
