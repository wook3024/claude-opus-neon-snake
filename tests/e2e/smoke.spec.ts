import { test, expect } from '@playwright/test';

test.describe('Neon Snake - Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('displays menu on load', async ({ page }) => {
    // Check title is visible
    await expect(page.locator('h1')).toContainText('Neon Snake');

    // Check start button is visible
    await expect(page.locator('button:has-text("Start Game")')).toBeVisible();

    // Check settings button is visible
    await expect(page.locator('button:has-text("Settings")')).toBeVisible();
  });

  test('can open and close settings', async ({ page }) => {
    // Click settings
    await page.locator('button:has-text("Settings")').click();

    // Settings panel should be visible
    await expect(page.locator('h2:has-text("Settings")')).toBeVisible();

    // Click close
    await page.locator('button:has-text("Close")').click();

    // Settings should be hidden, menu should be visible
    await expect(page.locator('h1:has-text("Neon Snake")')).toBeVisible();
  });

  test('can start classic game', async ({ page }) => {
    // Click start
    await page.locator('button:has-text("Start Game")').click();

    // Wait for game to start - HUD should be visible
    await expect(page.locator('text=Score')).toBeVisible({ timeout: 2000 });

    // Game should be playing - speed indicator should be visible
    await expect(page.locator('text=SPEED')).toBeVisible();
  });

  test('can select different game modes', async ({ page }) => {
    // Click Daily mode
    await page.locator('button:has-text("DAILY")').click();

    // Start game
    await page.locator('button:has-text("Start Game")').click();

    // HUD should show DAILY mode
    await expect(page.locator('text=DAILY')).toBeVisible({ timeout: 2000 });
  });

  test('can pause and resume game', async ({ page }) => {
    // Start game
    await page.locator('button:has-text("Start Game")').click();
    await page.waitForTimeout(500);

    // Press P to pause
    await page.keyboard.press('KeyP');

    // Paused overlay should be visible
    await expect(page.locator('h1:has-text("Paused")')).toBeVisible();

    // Press P again to resume
    await page.keyboard.press('KeyP');

    // Paused overlay should be hidden
    await expect(page.locator('h1:has-text("Paused")')).not.toBeVisible();
  });

  test('can control snake with arrow keys', async ({ page }) => {
    // Start game
    await page.locator('button:has-text("Start Game")').click();
    await page.waitForTimeout(500);

    // Press arrow keys
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(200);
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(200);
    await page.keyboard.press('ArrowDown');

    // Game should still be playing (not crashed)
    await expect(page.locator('text=Score')).toBeVisible();
  });

  test('can control snake with WASD', async ({ page }) => {
    // Start game
    await page.locator('button:has-text("Start Game")').click();
    await page.waitForTimeout(500);

    // Press WASD
    await page.keyboard.press('KeyW');
    await page.waitForTimeout(200);
    await page.keyboard.press('KeyA');
    await page.waitForTimeout(200);
    await page.keyboard.press('KeyS');

    // Game should still be playing
    await expect(page.locator('text=Score')).toBeVisible();
  });

  test('shows game over screen on collision', async ({ page }) => {
    // Start game
    await page.locator('button:has-text("Start Game")').click();
    await page.waitForTimeout(300);

    // Try to collide with wall by going up repeatedly
    await page.keyboard.press('ArrowUp');

    // Wait for game over (snake starts in middle, should hit wall eventually)
    // This is a bit flaky, so we give it more time
    await expect(page.locator('h1:has-text("Game Over")')).toBeVisible({
      timeout: 15000,
    });

    // Final score should be displayed
    await expect(page.locator('text=Final Score')).toBeVisible();

    // Try Again button should be visible
    await expect(page.locator('button:has-text("Try Again")')).toBeVisible();
  });

  test('can restart game from game over', async ({ page }) => {
    // Start game
    await page.locator('button:has-text("Start Game")').click();
    await page.waitForTimeout(300);

    // Go up to hit wall
    await page.keyboard.press('ArrowUp');

    // Wait for game over
    await expect(page.locator('h1:has-text("Game Over")')).toBeVisible({
      timeout: 15000,
    });

    // Click Try Again
    await page.locator('button:has-text("Try Again")').click();

    // Game should restart - HUD visible, Game Over hidden
    await expect(page.locator('text=Score')).toBeVisible();
    await expect(page.locator('h1:has-text("Game Over")')).not.toBeVisible();
  });

  test('can return to menu from game over', async ({ page }) => {
    // Start game
    await page.locator('button:has-text("Start Game")').click();
    await page.waitForTimeout(300);

    // Go up to hit wall
    await page.keyboard.press('ArrowUp');

    // Wait for game over
    await expect(page.locator('h1:has-text("Game Over")')).toBeVisible({
      timeout: 15000,
    });

    // Click Menu
    await page.locator('button:has-text("Menu")').click();

    // Should be back at menu
    await expect(page.locator('h1:has-text("Neon Snake")')).toBeVisible();
  });

  test('M key toggles mute', async ({ page }) => {
    // Start game
    await page.locator('button:has-text("Start Game")').click();
    await page.waitForTimeout(500);

    // Press M to mute (just checking it doesn't crash)
    await page.keyboard.press('KeyM');
    await page.waitForTimeout(100);

    // Press M again to unmute
    await page.keyboard.press('KeyM');

    // Game should still be running
    await expect(page.locator('text=Score')).toBeVisible();
  });

  test('T key cycles theme', async ({ page }) => {
    // Press T on menu to cycle theme
    await page.keyboard.press('KeyT');
    await page.waitForTimeout(100);

    // Menu should still be visible
    await expect(page.locator('h1:has-text("Neon Snake")')).toBeVisible();

    // Press T again
    await page.keyboard.press('KeyT');
    await page.waitForTimeout(100);

    // Still visible
    await expect(page.locator('h1:has-text("Neon Snake")')).toBeVisible();
  });

  test('canvas is present and rendered', async ({ page }) => {
    // Check canvas exists
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    // Canvas should have reasonable dimensions
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(100);
    expect(box!.height).toBeGreaterThan(100);
  });
});
