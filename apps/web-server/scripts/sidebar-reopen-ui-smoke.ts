// Two sidebar cycles in rooms with and without an invented workspace folder.
// Chromium's mac look checks CSS geometry, not native Electron drag regions.
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { assert, baseUrl, openRoom, requestJson, startRoomStateServer, stopRoomStateServer, tempHome } from "./room-state-setup.js";
import { SMOKE_AUTH_TOKEN } from "./smoke-server-process.js";

let error: unknown;
let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
try {
	await startRoomStateServer();
	const folder = path.join(tempHome, "demo-folder");
	fs.mkdirSync(folder);
	fs.writeFileSync(path.join(folder, "notes.md"), "# Invented notes\n");
	await openRoom("Folder Room", async (roomId) => {
		const saved = await requestJson(`/api/persistent-agents/${roomId}/workspace-default`, { method: "PUT", body: JSON.stringify({ root: folder, workspaceAccessMode: "localFiles" }) });
		assert(saved.status === 200, `folder saved: ${saved.status}`);
	});
	await openRoom("Plain Room");
	browser = await chromium.launch();
	for (const room of ["Folder Room", "Plain Room"]) {
		const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/140.0.0.0 Safari/537.36 ExxpertsDesktop" });
		await context.addInitScript(() => {
			localStorage.setItem("exxperts.sidebarCollapsed", "1");
			localStorage.setItem("exxperts.first-run-guide-seen", "1");
		});
		const page = await context.newPage();
		await page.goto(`${baseUrl}/auth/session?token=${SMOKE_AUTH_TOKEN}`);
		await page.waitForLoadState("networkidle");
		const dismiss = page.locator(".whats-new-close");
		if (await dismiss.count()) await dismiss.click();
		await page.locator(".persistent-agent-card").filter({ hasText: room }).getByRole("button", { name: /^(Enter|Resume)$/ }).click();
		await page.locator("textarea").first().waitFor();
		assert(await page.evaluate(() => document.documentElement.classList.contains("desktop-app-mac")), "desktop user agent enables mac look");
		for (let cycle = 0; cycle < 2; cycle++) {
			const show = page.getByRole("button", { name: "Show sidebar" });
			const topbar = await show.evaluate((button) => {
				const bar = document.querySelector(".topbar");
				return { after: !!bar && Boolean(bar.compareDocumentPosition(button) & Node.DOCUMENT_POSITION_FOLLOWING), region: bar && getComputedStyle(bar).getPropertyValue("-webkit-app-region") };
			});
			assert(topbar.after && topbar.region === "drag", `${room} cycle ${cycle + 1}: floating toggle follows the draggable topbar: ${JSON.stringify(topbar)}`);
			await show.waitFor();
			const geometry = await show.evaluate((button) => {
				const rect = button.getBoundingClientRect();
				const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
				return { hit: hit === button || button.contains(hit), region: getComputedStyle(button).getPropertyValue("-webkit-app-region"), rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height } };
			});
			assert(geometry.hit && geometry.region === "no-drag", `${room} cycle ${cycle + 1}: toggle hit and no-drag: ${JSON.stringify(geometry)}`);
			await show.click();
			await page.getByRole("button", { name: "Hide sidebar" }).waitFor();
			if (room === "Folder Room") {
				await page.locator(".sidebar-workspace-files").getByText("notes.md").waitFor();
				const aligned = async () => page.evaluate(() => {
					const slot = document.querySelector(".docs-tree-slot")!.getBoundingClientRect();
					const tree = document.querySelector(".docs-tree-host")!.getBoundingClientRect();
					return [slot.left - tree.left, slot.top - tree.top, slot.width - tree.width, slot.height - tree.height].every((difference) => Math.abs(difference) < 1);
				});
				await page.waitForFunction(() => {
					const slot = document.querySelector(".docs-tree-slot")!.getBoundingClientRect();
					const tree = document.querySelector(".docs-tree-host")!.getBoundingClientRect();
					return [slot.left - tree.left, slot.top - tree.top, slot.width - tree.width, slot.height - tree.height].every((difference) => Math.abs(difference) < 1);
				});
				if (cycle === 0) {
					const beforeWidth = await page.locator(".docs-tree-slot").evaluate((slot) => slot.getBoundingClientRect().width);
					const resize = page.getByRole("separator", { name: "Resize sidebar" });
					const rect = await resize.boundingBox();
					assert(rect, "sidebar resize handle has bounds");
					await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
					await page.mouse.down();
					await page.mouse.move(rect.x + 70, rect.y + rect.height / 2, { steps: 5 });
					await page.mouse.up();
					await page.waitForFunction(() => {
						const slot = document.querySelector(".docs-tree-slot")!.getBoundingClientRect();
						const tree = document.querySelector(".docs-tree-host")!.getBoundingClientRect();
						return [slot.left - tree.left, slot.top - tree.top, slot.width - tree.width, slot.height - tree.height].every((difference) => Math.abs(difference) < 1);
					});
					assert(await page.locator(".docs-tree-slot").evaluate((slot) => slot.getBoundingClientRect().width) > beforeWidth + 30, "the actual sidebar was resized");
					assert(await aligned(), "tree remains aligned to the actual sidebar after resizing");
				}
			}
			await page.getByRole("button", { name: "Hide sidebar" }).click();
			if (room === "Folder Room") {
				await page.waitForFunction(() => {
					const tree = document.querySelector(".docs-tree-host")!.getBoundingClientRect();
					return tree.width === 0 && tree.height === 0;
				});
				assert(!(await page.locator(".sidebar-workspace-files").getByText("notes.md").isVisible()), "collapsed sidebar does not leave tree entries visible");
			}
		}
		if (room === "Folder Room") {
			await page.setViewportSize({ width: 390, height: 844 });
			await page.getByRole("button", { name: "Show sidebar" }).click();
			const note = page.locator(".sidebar-workspace-files").getByText("notes.md");
			await note.waitFor();
			await page.locator(".sidebar-config-gear").click();
			const settingsItem = page.getByRole("menuitem", { name: "Settings" });
			await settingsItem.waitFor();
			assert(await settingsItem.evaluate((item) => { const rect = item.getBoundingClientRect(); const hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2); return hit === item || item.contains(hit); }), "sidebar menu remains above the document tree");
			await settingsItem.click();
			await page.locator(".settings-dialog-backdrop").waitFor();
			assert(await note.evaluate((node) => { const rect = node.getBoundingClientRect(); const hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2); return !hit || !node.contains(hit); }), "settings overlays the document tree");
			await page.keyboard.press("Escape");
			await page.locator(".settings-dialog-backdrop").waitFor({ state: "detached" });
			await page.locator(".sidebar-drawer-backdrop").click({ position: { x: 380, y: 400 } });
			await page.getByRole("button", { name: "Show sidebar" }).click();
			await note.click();
			await page.getByRole("complementary", { name: "Markdown editor: notes.md" }).waitFor();
		}
		await context.close();
	}
	console.log("sidebar reopen UI smoke: two cycles per room passed in Chromium mac look");
} catch (caught) {
	error = caught;
} finally {
	await browser?.close();
	await stopRoomStateServer(error);
}
if (error) throw error;
