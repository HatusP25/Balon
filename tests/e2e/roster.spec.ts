import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/login");
  const pw = process.env.ADMIN_PASSWORD ?? "changeme";
  await page.fill('input[name="password"]', pw);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/");
});

test("create, edit, archive a player", async ({ page }) => {
  const unique = `E2E_${Date.now()}`;

  await page.goto("/roster");
  await page.click('a[href="/roster/new"]');
  await page.fill('input[name="nickname"]', unique);
  await page.fill('input[name="jerseyNumber"]', "42");
  await page.selectOption('select[name="preferredPosition"]', "FW");
  await page.getByRole("button", { name: "Add Player" }).click();

  await page.waitForURL("**/roster");
  await expect(page.getByText(unique, { exact: true })).toBeVisible();

  await page.getByText(unique, { exact: true }).click();
  await page.waitForURL(/\/roster\/.+\/edit$/);
  await page.fill('input[name="nickname"]', `${unique}_x`);
  await page.getByRole("button", { name: "Save Changes" }).click();

  await page.waitForURL("**/roster");
  await expect(page.getByText(`${unique}_x`, { exact: true })).toBeVisible();

  await page.getByText(`${unique}_x`, { exact: true }).click();
  await page.waitForURL(/\/roster\/.+\/edit$/);
  await page.click('button:has-text("Archive player")');
  await page.click('button:has-text("Confirm archive")');

  await page.waitForURL("**/roster");
  await expect(page.getByText(`${unique}_x`, { exact: true })).toHaveCount(0);
});

test("nickname uniqueness is enforced", async ({ page }) => {
  const unique = `DUP_${Date.now()}`;

  await page.goto("/roster/new");
  await page.fill('input[name="nickname"]', unique);
  await page.getByRole("button", { name: "Add Player" }).click();
  await page.waitForURL("**/roster");

  await page.goto("/roster/new");
  await page.fill('input[name="nickname"]', unique);
  await page.getByRole("button", { name: "Add Player" }).click();
  await expect(page.getByText(/already taken/i)).toBeVisible();
});
