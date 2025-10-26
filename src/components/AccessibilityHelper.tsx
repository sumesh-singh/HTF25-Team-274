import React, { useEffect, useState } from "react";
import { Eye, EyeOff, Type, Contrast, Volume2, VolumeX } from "lucide-react";

interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  screenReader: boolean;
  soundEnabled: boolean;
}

export const AccessibilityHelper = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<AccessibilitySettings>({
    highContrast: false,
    largeText: false,
    reducedMotion: false,
    screenReader: false,
    soundEnabled: true,
  });

  // Load settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("accessibility-settings");
    if (saved) {
      try {
        const parsedSettings = JSON.parse(saved);
        setSettings(parsedSettings);
        applySettings(parsedSettings);
      } catch (error) {
        console.error("Failed to load accessibility settings:", error);
      }
    }

    // Check for system preferences
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setSettings((prev) => ({ ...prev, reducedMotion: true }));
    }

    if (window.matchMedia("(prefers-contrast: high)").matches) {
      setSettings((prev) => ({ ...prev, highContrast: true }));
    }
  }, []);

  // Apply settings to DOM
  const applySettings = (newSettings: AccessibilitySettings) => {
    const root = document.documentElement;

    // High contrast
    if (newSettings.highContrast) {
      root.classList.add("high-contrast");
    } else {
      root.classList.remove("high-contrast");
    }

    // Large text
    if (newSettings.largeText) {
      root.classList.add("large-text");
    } else {
      root.classList.remove("large-text");
    }

    // Reduced motion
    if (newSettings.reducedMotion) {
      root.classList.add("reduce-motion");
    } else {
      root.classList.remove("reduce-motion");
    }

    // Screen reader announcements
    if (newSettings.screenReader) {
      root.setAttribute("data-screen-reader", "true");
    } else {
      root.removeAttribute("data-screen-reader");
    }
  };

  // Update setting
  const updateSetting = (key: keyof AccessibilitySettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    applySettings(newSettings);

    // Save to localStorage
    localStorage.setItem("accessibility-settings", JSON.stringify(newSettings));

    // Announce change to screen readers
    announceChange(key, value);
  };

  // Announce changes to screen readers
  const announceChange = (setting: string, enabled: boolean) => {
    const announcement = `${setting.replace(/([A-Z])/g, " $1").toLowerCase()} ${
      enabled ? "enabled" : "disabled"
    }`;

    // Create temporary announcement element
    const announcer = document.createElement("div");
    announcer.setAttribute("aria-live", "polite");
    announcer.setAttribute("aria-atomic", "true");
    announcer.className = "sr-only";
    announcer.textContent = announcement;

    document.body.appendChild(announcer);

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcer);
    }, 1000);
  };

  // Reset all settings
  const resetSettings = () => {
    const defaultSettings: AccessibilitySettings = {
      highContrast: false,
      largeText: false,
      reducedMotion: false,
      screenReader: false,
      soundEnabled: true,
    };

    setSettings(defaultSettings);
    applySettings(defaultSettings);
    localStorage.removeItem("accessibility-settings");
    announceChange("all settings", false);
  };

  // Skip to main content
  const skipToMain = () => {
    const main = document.querySelector("main");
    if (main) {
      main.focus();
      main.scrollIntoView();
    }
  };

  return (
    <>
      {/* Skip to main content link */}
      <a
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          skipToMain();
        }}
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg focus:shadow-lg"
      >
        Skip to main content
      </a>

      {/* Accessibility menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-40 p-3 bg-primary text-white rounded-full shadow-lg hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
        aria-label="Open accessibility menu"
        aria-expanded={isOpen}
      >
        <Eye className="h-5 w-5" />
      </button>

      {/* Accessibility panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-50 w-80 bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-xl shadow-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
              Accessibility
            </h2>
            <button
              onClick={() => setIsOpen(false)}
              className="text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary"
              aria-label="Close accessibility menu"
            >
              <EyeOff className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            {/* High Contrast */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Contrast className="h-4 w-4 text-text-light-secondary dark:text-text-dark-secondary" />
                <label htmlFor="high-contrast" className="text-sm font-medium">
                  High Contrast
                </label>
              </div>
              <input
                id="high-contrast"
                type="checkbox"
                checked={settings.highContrast}
                onChange={(e) =>
                  updateSetting("highContrast", e.target.checked)
                }
                className="rounded border-border-light dark:border-border-dark"
              />
            </div>

            {/* Large Text */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Type className="h-4 w-4 text-text-light-secondary dark:text-text-dark-secondary" />
                <label htmlFor="large-text" className="text-sm font-medium">
                  Large Text
                </label>
              </div>
              <input
                id="large-text"
                type="checkbox"
                checked={settings.largeText}
                onChange={(e) => updateSetting("largeText", e.target.checked)}
                className="rounded border-border-light dark:border-border-dark"
              />
            </div>

            {/* Reduced Motion */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 text-text-light-secondary dark:text-text-dark-secondary">
                  🎭
                </div>
                <label htmlFor="reduced-motion" className="text-sm font-medium">
                  Reduce Motion
                </label>
              </div>
              <input
                id="reduced-motion"
                type="checkbox"
                checked={settings.reducedMotion}
                onChange={(e) =>
                  updateSetting("reducedMotion", e.target.checked)
                }
                className="rounded border-border-light dark:border-border-dark"
              />
            </div>

            {/* Screen Reader */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 text-text-light-secondary dark:text-text-dark-secondary">
                  🔊
                </div>
                <label htmlFor="screen-reader" className="text-sm font-medium">
                  Screen Reader Mode
                </label>
              </div>
              <input
                id="screen-reader"
                type="checkbox"
                checked={settings.screenReader}
                onChange={(e) =>
                  updateSetting("screenReader", e.target.checked)
                }
                className="rounded border-border-light dark:border-border-dark"
              />
            </div>

            {/* Sound */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {settings.soundEnabled ? (
                  <Volume2 className="h-4 w-4 text-text-light-secondary dark:text-text-dark-secondary" />
                ) : (
                  <VolumeX className="h-4 w-4 text-text-light-secondary dark:text-text-dark-secondary" />
                )}
                <label htmlFor="sound-enabled" className="text-sm font-medium">
                  Sound Effects
                </label>
              </div>
              <input
                id="sound-enabled"
                type="checkbox"
                checked={settings.soundEnabled}
                onChange={(e) =>
                  updateSetting("soundEnabled", e.target.checked)
                }
                className="rounded border-border-light dark:border-border-dark"
              />
            </div>
          </div>

          {/* Reset button */}
          <div className="mt-6 pt-4 border-t border-border-light dark:border-border-dark">
            <button
              onClick={resetSettings}
              className="w-full px-4 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg hover:bg-primary/5 transition-colors"
            >
              Reset to Defaults
            </button>
          </div>

          {/* Keyboard shortcuts info */}
          <div className="mt-4 p-3 bg-primary/5 rounded-lg">
            <h3 className="text-sm font-medium mb-2">Keyboard Shortcuts:</h3>
            <ul className="text-xs space-y-1 text-text-light-secondary dark:text-text-dark-secondary">
              <li>Tab - Navigate forward</li>
              <li>Shift + Tab - Navigate backward</li>
              <li>Enter/Space - Activate buttons</li>
              <li>Esc - Close dialogs</li>
            </ul>
          </div>
        </div>
      )}

      {/* Screen reader only announcements */}
      <div
        id="announcements"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
    </>
  );
};

// Hook for accessibility settings
export const useAccessibility = () => {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    highContrast: false,
    largeText: false,
    reducedMotion: false,
    screenReader: false,
    soundEnabled: true,
  });

  useEffect(() => {
    const saved = localStorage.getItem("accessibility-settings");
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (error) {
        console.error("Failed to load accessibility settings:", error);
      }
    }
  }, []);

  return settings;
};

export default AccessibilityHelper;
