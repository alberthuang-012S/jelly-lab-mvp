const EVENT_NAMES = new Set([
  "session_start",
  "first_meaningful_interaction",
  "daily_companion_complete",
  "weekly_companion_progress",
  "weekly_companion_complete",
  "feed_complete",
  "level_up",
  "outfit_change",
  "battle_start",
  "battle_end",
  "save_failure",
  "save_recovery"
]);

function getMode() {
  if (typeof window === "undefined") return "normal";
  return new URLSearchParams(window.location.search).get("debug") === "1" ? "debug" : "normal";
}

function getSessionId() {
  if (typeof window === "undefined") return null;
  if (!window.__jellyLabSessionId) {
    window.__jellyLabSessionId = typeof globalThis.crypto?.randomUUID === "function"
      ? globalThis.crypto.randomUUID()
      : `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
  return window.__jellyLabSessionId;
}

export function trackEvent(eventName, payload = {}) {
  const event = {
    eventName,
    payload: {
      ...payload,
      mode: payload.mode || getMode()
    },
    sessionId: getSessionId(),
    at: new Date().toISOString()
  };

  if (typeof window !== "undefined") {
    window.__jellyLabEvents = window.__jellyLabEvents || [];
    window.__jellyLabEvents.push(event);
    if (typeof CustomEvent === "function") {
      window.dispatchEvent?.(new CustomEvent("jellylab:analytics", { detail: event }));
    }
  }

  if (EVENT_NAMES.has(eventName) || getMode() === "debug") {
    console.info(`[Jelly Lab] ${eventName}`, event.payload);
  }

  return event;
}

export function startSession() {
  if (typeof window === "undefined" || window.__jellyLabSessionStarted) return null;
  window.__jellyLabSessionStarted = true;
  return trackEvent("session_start");
}

export function trackFirstMeaningfulInteraction(identity = "anonymous", payload = {}) {
  if (typeof window === "undefined") return null;
  const key = `jellyLabFirstMeaningful:${String(identity)}`;
  try {
    if (window.localStorage.getItem(key)) return null;
    window.localStorage.setItem(key, new Date().toISOString());
  } catch {
    if (window.__jellyLabFirstMeaningfulInteractionTracked) return null;
    window.__jellyLabFirstMeaningfulInteractionTracked = true;
  }
  return trackEvent("first_meaningful_interaction", payload);
}
