import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/login");
  const pw = process.env.ADMIN_PASSWORD ?? "changeme";
  await page.fill('input[name="password"]', pw);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/");
});

test("create match → enter result → leaderboard shows it → image endpoint returns PNG", async ({
  page,
  context,
}) => {
  const scorerName = `Scorer_${Date.now()}`;
  const assisterName = `Assister_${Date.now()}`;

  // Create two players
  for (const name of [scorerName, assisterName]) {
    await page.goto("/roster/new");
    await page.fill('input[name="nickname"]', name);
    await page.getByRole("button", { name: "Add Player" }).click();
    await page.waitForURL("**/roster");
  }

  // Create a past-dated match
  await page.goto("/matches/new");
  const past = new Date(Date.now() - 60 * 60 * 1000);
  await page.fill('input[name="playedAt"]', past.toISOString().slice(0, 16));
  await page.fill('input[name="opponentName"]', "E2E Result");
  await page.getByRole("button", { name: "Create Match" }).click();
  await page.waitForURL(/\/matches\/.+\/lineup/);

  // Capture the slug for the image endpoint check (read from the "Public link" anchor before navigating away)
  const publicHref = await page.locator('a:has-text("Public link")').getAttribute("href");
  const slug = publicHref?.split("/").pop() ?? "";
  expect(slug).toMatch(/^[A-Za-z0-9_-]{6}$/);

  // Go to result entry
  await page.getByRole("link", { name: /enter result/i }).click();
  await page.waitForURL(/\/matches\/.+\/result/);

  // Set score 2-1
  await page.fill('input[name="ourScore"]', "2");
  await page.fill('input[name="theirScore"]', "1");

  // Check both players in attendance
  await page
    .locator("label")
    .filter({ hasText: scorerName })
    .locator('input[type="checkbox"]')
    .check();
  await page
    .locator("label")
    .filter({ hasText: assisterName })
    .locator('input[type="checkbox"]')
    .check();

  // Add two goals (defaults will pick from attendance dropdown)
  await page.getByRole("button", { name: /add goal/i }).click();
  await page.getByRole("button", { name: /add goal/i }).click();

  // Save
  await page.getByRole("button", { name: /save result/i }).click();
  await page.waitForURL("**/matches");

  // Public leaderboard shows the players
  const anonContext = await context.browser()!.newContext();
  const anonPage = await anonContext.newPage();
  await anonPage.goto("http://localhost:3000/p/stats");
  await expect(anonPage.getByText(scorerName)).toBeVisible();

  // Player profile reachable
  await anonPage.getByRole("link", { name: scorerName }).first().click();
  await expect(anonPage.getByText(/matches/i).first()).toBeVisible();
  await anonContext.close();

  // Image endpoint returns 200 + content-type image/png
  const res = await page.request.get(`/api/og/match/${slug}`);
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("image/png");
});
