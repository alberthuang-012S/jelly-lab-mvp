export function trackEvent(eventName, payload = {}) {
  if (typeof window !== "undefined") {
    window.__jellyLabEvents = window.__jellyLabEvents || [];
    window.__jellyLabEvents.push({ eventName, payload, at: new Date().toISOString() });
  }

  console.info(`[Jelly Lab] ${eventName}`, payload);
}
