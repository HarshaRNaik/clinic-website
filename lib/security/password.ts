const HIBP_RANGE_ENDPOINT = "https://api.pwnedpasswords.com/range/";

export async function checkPasswordSafety(password: string): Promise<{ ok: boolean; message?: string }> {
  if (password.length < 6) {
    return { ok: false, message: "Password must be at least 6 characters." };
  }

  if (typeof window === "undefined" || !window.crypto?.subtle) {
    return { ok: false, message: "Password security check is unavailable. Please try again." };
  }

  try {
    const digest = await window.crypto.subtle.digest("SHA-1", new TextEncoder().encode(password));
    const hash = Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 5000);
    const response = await fetch(`${HIBP_RANGE_ENDPOINT}${hash.slice(0, 5)}`, {
      headers: { "Add-Padding": "true" },
      signal: controller.signal
    });
    window.clearTimeout(timeout);

    if (!response.ok) {
      return { ok: false, message: "Password security check is unavailable. Please try again." };
    }

    const suffix = hash.slice(5);
    const breached = (await response.text()).split("\n").some((line) => line.trim().toUpperCase().startsWith(`${suffix}:`));
    return breached
      ? { ok: false, message: "This password has appeared in a public breach. Choose a different password." }
      : { ok: true };
  } catch {
    return { ok: false, message: "Password security check is unavailable. Please try again." };
  }
}
