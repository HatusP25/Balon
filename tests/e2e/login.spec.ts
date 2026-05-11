import { test, expect } from "@playwright/test";

test("rejects wrong password", async ({ page }) => {
  await page.goto("/login");
  await page.fill('input[name="password"]', "wrong");
  await page.click('button[type="submit"]');
  await expect(page.getByText(/wrong password/i)).toBeVisible();
});

test("accepts correct password and redirects to dashboard", async ({ page }) => {
  await page.goto("/login");
  const pw = process.env.ADMIN_PASSWORD ?? "changeme";
  await page.fill('input[name="password"]', pw);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/");
  await expect(page.getByRole("heading", { name: /today/i })).toBeVisible();
});

test("admin route redirects to login when not authenticated", async ({ page, context }) => {
  await context.clearCookies();
  await page.goto("/roster");
  await page.waitForURL("**/login");
});
