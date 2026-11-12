// Remembers the main window's size/position (and maximized flag) across
// launches. Stored in userData; restored only when the saved bounds still
// intersect a connected display's work area, so a detached monitor never
// strands the window off-screen.
import fs from "node:fs";
import path from "node:path";
import { app, BrowserWindow, screen, type Rectangle } from "electron";

type DocumentsState = { schemaVersion: 1; bounds: Rectangle; maximized: boolean; source: "electron-normal-bounds" };
type SavedState = { bounds?: Rectangle; maximized?: boolean; documents?: DocumentsState };

const stateFile = () => path.join(app.getPath("userData"), "window-state.json");

function readState(): SavedState {
	try {
		const state: unknown = JSON.parse(fs.readFileSync(stateFile(), "utf8"));
		return state && typeof state === "object" && !Array.isArray(state) ? state as SavedState : {};
	} catch { return {}; }
}

function writeState(update: Partial<SavedState>): void {
	try {
		const file = stateFile();
		fs.mkdirSync(path.dirname(file), { recursive: true });
		fs.writeFileSync(file, JSON.stringify({ ...readState(), ...update }));
	} catch { /* remembering window placement is best-effort */ }
}

function validDocumentsState(value: unknown): value is DocumentsState {
	if (!value || typeof value !== "object" || Array.isArray(value)) return false;
	const state = value as Record<string, unknown>;
	const bounds = state.bounds;
	return Object.keys(state).sort().join(",") === "bounds,maximized,schemaVersion,source" && state.schemaVersion === 1 && state.maximized !== undefined && typeof state.maximized === "boolean" && state.source === "electron-normal-bounds" && !!bounds && typeof bounds === "object" && !Array.isArray(bounds) && Object.keys(bounds).sort().join(",") === "height,width,x,y" && Object.values(bounds).every((number) => typeof number === "number" && Number.isFinite(number)) && (bounds as Rectangle).width > 0 && (bounds as Rectangle).height > 0;
}

function normalBounds(win: BrowserWindow): Rectangle {
	const bounds = win.isMaximized() || win.isFullScreen() ? win.getNormalBounds() : win.getBounds();
	return { x: Math.round(bounds.x), y: Math.round(bounds.y), width: Math.round(bounds.width), height: Math.round(bounds.height) };
}

/** Validated native child placement from the existing state record, or null when display geometry is unavailable. */
export function loadDocumentsWindowState(main: BrowserWindow, current?: { bounds: Rectangle; maximized: boolean }): { bounds: Rectangle; maximized: boolean } | null {
	let displays;
	try { displays = screen.getAllDisplays().filter((display) => [display.workArea.x, display.workArea.y, display.workArea.width, display.workArea.height].every(Number.isFinite) && display.workArea.width > 0 && display.workArea.height > 0); } catch { return null; }
	if (!displays.length) return null;
	const center = main.getBounds();
	const point = { x: center.x + center.width / 2, y: center.y + center.height / 2 };
	let nearestId: number | undefined;
	try { nearestId = screen.getDisplayNearestPoint(point).id; } catch {}
	const nearest = displays.find((display) => display.id === nearestId) ?? displays[0]!;
	const state = current ?? readState().documents;
	const valid = current
		? [current.bounds.x, current.bounds.y, current.bounds.width, current.bounds.height].every(Number.isFinite) && current.bounds.width > 0 && current.bounds.height > 0 ? current : null
		: validDocumentsState(state) ? state : null;
	let selected = nearest;
	if (valid) {
		const b = valid.bounds;
		const intersections = displays.map((display) => {
			const a = display.workArea;
			const width = Math.max(0, Math.min(b.x + b.width, a.x + a.width) - Math.max(b.x, a.x));
			const height = Math.max(0, Math.min(b.y + b.height, a.y + a.height) - Math.max(b.y, a.y));
			return { display, area: width * height };
		});
		const largest = Math.max(...intersections.map((entry) => entry.area));
		if (largest > 0) selected = intersections.find((entry) => entry.area === largest && entry.display.id === nearest.id)?.display ?? intersections.find((entry) => entry.area === largest)!.display;
	}
	const area = selected.workArea;
	const width = valid ? Math.min(area.width, Math.max(Math.min(640, area.width), Math.round(valid.bounds.width))) : Math.min(900, area.width);
	const height = valid ? Math.min(area.height, Math.max(Math.min(480, area.height), Math.round(valid.bounds.height))) : Math.min(700, area.height);
	const maxX = area.x + area.width - width, maxY = area.y + area.height - height;
	const x = valid ? Math.max(area.x, Math.min(Math.round(valid.bounds.x), maxX)) : Math.round(area.x + (area.width - width) / 2);
	const y = valid ? Math.max(area.y, Math.min(Math.round(valid.bounds.y), maxY)) : Math.round(area.y + (area.height - height) / 2);
	return { bounds: { x, y, width, height }, maximized: valid?.maximized ?? false };
}

export function loadWindowState(): SavedState {
	const state = readState();
	const b = state.bounds;
	if (!b || ![b.x, b.y, b.width, b.height].every(Number.isFinite) || b.width < 400 || b.height < 300) return {};
	const visible = screen.getAllDisplays().some((d) => {
		const a = d.workArea;
		return b.x < a.x + a.width && b.x + b.width > a.x && b.y < a.y + a.height && b.y + b.height > a.y;
	});
	return visible ? state : {};
}

export function trackWindowState(win: BrowserWindow): void {
  let timer: NodeJS.Timeout | null = null;
  const save = () => {
    if (win.isDestroyed()) return;
		writeState({ bounds: normalBounds(win), maximized: win.isMaximized() });
  };
  const debounced = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(save, 500);
  };
  win.on("resize", debounced);
  win.on("move", debounced);
  win.on("maximize", debounced);
  win.on("unmaximize", debounced);
  // The window only hides on close (tray semantics), so save immediately too.
	win.on("close", () => { if (timer) clearTimeout(timer); timer = null; save(); });
}

export function trackDocumentsWindowState(win: BrowserWindow): void {
	let timer: NodeJS.Timeout | null = null;
	const save = () => writeState({ documents: { schemaVersion: 1, bounds: normalBounds(win), maximized: win.isMaximized(), source: "electron-normal-bounds" } });
	const debounced = () => {
		if (timer) clearTimeout(timer);
		timer = setTimeout(save, 500);
	};
	win.on("resize", debounced);
	win.on("move", debounced);
	win.on("maximize", debounced);
	win.on("unmaximize", debounced);
	win.on("close", () => { if (timer) clearTimeout(timer); timer = null; if (!win.isDestroyed()) save(); });
}
