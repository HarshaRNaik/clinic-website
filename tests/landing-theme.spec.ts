import { expect, test } from "@playwright/test";

function contrastRatio(foreground: [number, number, number], background: [number, number, number]) {
  const luminance = (rgb: [number, number, number]) => {
    const channels = rgb.map((channel) => channel / 255).map((channel) => channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  };
  const lighter = luminance(foreground);
  const darker = luminance(background);
  return (Math.max(lighter, darker) + 0.05) / (Math.min(lighter, darker) + 0.05);
}

test.describe("Arogya landing theme", () => {
  test("renders opaque panel fills and readable white text", async ({ page }) => {
    await page.goto("http://localhost:3000/");
    for (const selector of [".panel--patient", ".panel--doctor"]) {
      const panel = page.locator(selector);
      await expect(panel).toBeVisible();
      const background = await panel.evaluate((element) => getComputedStyle(element).backgroundColor);
      expect(background).not.toMatch(/transparent|rgba\(0, 0, 0, 0\)/);
      expect(background).not.toBe("rgb(255, 255, 255)");
      expect(contrastRatio([255, 255, 255], background.match(/\d+/g).slice(0, 3).map(Number) as [number, number, number])).toBeGreaterThanOrEqual(4.5);
    }
  });
});
