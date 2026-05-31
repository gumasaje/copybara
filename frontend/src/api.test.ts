import { afterEach, describe, expect, it, vi } from "vitest";
import { api, getStoredToken, setStoredToken } from "./api";

describe("api session handling", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    setStoredToken(null);
  });

  it("clears the stored token and emits a session-expired event on protected 401 responses", async () => {
    setStoredToken("expired-token");
    const listener = vi.fn();
    window.addEventListener("copybara:session-expired", listener);
    vi.spyOn(window, "fetch").mockResolvedValue(new Response(null, { status: 401 }));

    await expect(api.getMe()).rejects.toThrow("세션이 만료되었습니다. 다시 로그인해 주세요.");

    expect(getStoredToken()).toBeNull();
    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener("copybara:session-expired", listener);
  });
});
