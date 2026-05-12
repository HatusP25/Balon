import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/login");
  const pw = process.env.ADMIN_PASSWORD ?? "changeme";
  await page.fill('input[name="password"]', pw);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/");
});

test("create match → land on lineup builder → public URL works", async ({ page, context }) => {
  // Ensure at least one regular exists for the picker
  const playerName = `LineupTester_${Date.now()}`;
  await page.goto("/roster/new");
  await page.fill('input[name="nickname"]', playerName);
  await page.getByRole("button", { name: "Add Player" }).click();
  await page.waitForURL("**/roster");

  // Create a match
  await page.goto("/matches/new");
  // datetime-local needs ISO-ish without seconds
  const future = new Date(Date.now() + 1000 * 60 * 60 * 24);
  const iso = future.toISOString().slice(0, 16);
  await page.fill('input[name="playedAt"]', iso);
  await page.fill('input[name="opponentName"]', "E2E Opponents");
  await page.getByRole("button", { name: "Create Match" }).click();

  // Lands on lineup builder
  await page.waitForURL(/\/matches\/.+\/lineup/);
  await expect(page.getByText("vs E2E Opponents")).toBeVisible();

  // Assign the player to the first slot via the picker modal
  const firstSlot = page.locator('button[aria-label="Add player"]').first();
  await firstSlot.click();
  // Scope the click to the modal's player list to avoid matching the roster pool button
  await page.locator('li').getByRole("button", { name: playerName, exact: true }).click();

  // Player chip should now show on the field (modal has closed, chip label visible on pitch)
  await expect(page.getByText(playerName).first()).toBeVisible();

  // Get the public link href
  const publicHref = await page.locator('a:has-text("Public link")').getAttribute("href");
  expect(publicHref).toMatch(/^\/p\/match\/[A-Za-z0-9_-]{6}$/);

  // Visit the public URL in a fresh, unauthenticated context
  const anonContext = await context.browser()!.newContext();
  const anonPage = await anonContext.newPage();
  await anonPage.goto(`http://localhost:3000${publicHref}`);
  await expect(anonPage.getByText("vs E2E Opponents")).toBeVisible();
  await expect(anonPage.getByText(playerName)).toBeVisible();
  await anonContext.close();
});
