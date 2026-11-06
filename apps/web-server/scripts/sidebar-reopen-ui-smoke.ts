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
		const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
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
		await page.evaluate(() => document.documentElement.classList.add("desktop-app-mac"));
		for (let cycle = 0; cycle < 2; cycle++) {
			const show = page.getByRole("button", { name: "Show sidebar" });
			await show.waitFor();
			const geometry = await show.evaluate((button) => {
				const rect = button.getBoundingClientRect();
				const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
				return { hit: hit === button || button.contains(hit), region: getComputedStyle(button).getPropertyValue("-webkit-app-region"), rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height } };
			});
			assert(geometry.hit && geometry.region === "no-drag", `${room} cycle ${cycle + 1}: toggle hit and no-drag: ${JSON.stringify(geometry)}`);
			await show.click();
			await page.getByRole("button", { name: "Hide sidebar" }).waitFor();
			if (room === "Folder Room") await page.locator(".sidebar-workspace-files").getByText("notes.md").waitFor();
			await page.getByRole("button", { name: "Hide sidebar" }).click();
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
