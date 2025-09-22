import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { loadUserPreferences, onPreferencesChanged, saveUserPreferences } from "./preferences";
import { UserPreferences } from "./types";
import "./styles.css";


const filterLabels: Record<keyof UserPreferences["filters"], string> = {
  charactersFilter: "Filter forbidden characters",
  blockedChannels: "Filter blocked channels",
  forbiddenWordsInChannelName: "Filter forbidden words in channel names",
  forbiddenWordsInComment: "Filter forbidden words in comments",
  filterSoftWordsInComment: "Filter soft words in comments",
  forbiddenCommentPatterns: "Filter forbidden comment patterns",
};

const Popup: React.FC = () => {
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);

  // Load preferences on mount
  useEffect(() => {
    async function init() {
      const loaded = await loadUserPreferences();
      setPrefs(loaded);
    }
    init();

    // Listen for changes in other tabs
    onPreferencesChanged((newPrefs) => setPrefs(newPrefs));
  }, []);

  if (!prefs) return <div className="p-4 text-center">Loading...</div>;

  // Handle toggle change
  const handleToggle = (key: keyof UserPreferences["filters"]) => {
    const updated = {
      ...prefs,
      filters: {
        ...prefs.filters,
        [key]: !prefs.filters[key],
      },
    };
    setPrefs(updated);
    saveUserPreferences(updated);
  };

  return (
    <div className="w-80 p-4 font-sans bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4 text-center">UTTP Blocker</h2>
      <div className="flex flex-col gap-3">
        {Object.keys(filterLabels).map((key) => {
          const filterKey = key as keyof UserPreferences["filters"];
          return (
            <label
              key={key}
              className="flex justify-between items-center p-2 bg-gray-100 dark:bg-gray-700 rounded cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            >
              <span className="text-sm">{filterLabels[filterKey]}</span>
              <input
                type="checkbox"
                checked={prefs.filters[filterKey]}
                onChange={() => handleToggle(filterKey)}
                className="w-5 h-5 accent-blue-500"
              />
            </label>
          );
        })}
      </div>

      <div className="mt-6 text-center space-y-2">
        <a
          href="https://www.paypal.com/paypalme/achrafcodeur"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-4 py-2 bg-yellow-400 text-black font-semibold rounded shadow hover:bg-yellow-300 transition"
        >
          Support via Donation
        </a>
        <div>
          <a
            href="privacy.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-500 hover:text-gray-700 underline"
          >
            Privacy Policy
          </a>
        </div>
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
);
