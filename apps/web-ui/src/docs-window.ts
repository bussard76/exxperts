import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// Design lane (T20): the room's documents can sit in their own window. The
// document pane stays rendered by the same React tree; only its host element
// moves between the chat slot and the popup body, so open files and unsaved
// drafts are not remounted when it moves.
const BOUNDS_KEY = "exxperts.docsWindowBounds";

type Bounds = { x: number; y: number; w: number; h: number };

function readBounds(): Bounds | null {
	try {
		const raw = JSON.parse(localStorage.getItem(BOUNDS_KEY) ?? "null") as Partial<Bounds> | null;
		if (!raw || ![raw.x, raw.y, raw.w, raw.h].every((n) => typeof n === "number" && Number.isFinite(n))) return null;
		return raw as Bounds;
	} catch { return null; }
}

// The last position, kept only if it still lies on a screen that exists.
function visibleBounds(saved: Bounds | null): Bounds {
	const w = Math.min(saved?.w ?? 900, window.screen.availWidth);
	const h = Math.min(saved?.h ?? 700, window.screen.availHeight);
	const fallback = { x: Math.round(window.screenX + 40), y: Math.round(window.screenY + 40) };
	// Browsers cannot list screens: accept positions within about three screen widths, else fall back beside the chat.
	const reach = window.screen.availWidth * 3;
	const onScreen = saved && Math.abs(saved.x) < reach && saved.y > -50 && saved.y < window.screen.availHeight;
	return { ...(onScreen ? { x: saved.x, y: saved.y } : fallback), w, h };
}

function copyAppearance(from: Document, to: Document): void {
	to.documentElement.className = from.documentElement.className;
	for (const attr of Array.from(from.documentElement.attributes)) if (attr.name !== "class") to.documentElement.setAttribute(attr.name, attr.value);
	to.body.className = from.body.className;
}

export function useDocsWindow(roomKey: string | null, roomName: string) {
	const host = useMemo(() => {
		const el = document.createElement("div");
		el.className = "docs-host";
		return el;
	}, []);
	const winRef = useRef<Window | null>(null);
	const inlineRef = useRef<HTMLElement | null>(null);
	const [detached, setDetached] = useState(false);

	const returnToChat = useCallback(() => {
		const win = winRef.current;
		winRef.current = null;
		if (win && !win.closed) {
			try { localStorage.setItem(BOUNDS_KEY, JSON.stringify({ x: win.screenX, y: win.screenY, w: win.outerWidth, h: win.outerHeight })); } catch {}
			win.close();
		}
		inlineRef.current?.appendChild(host);
		setDetached(false);
	}, [host]);

	// A named window: detaching again reaches the same window.
	const detach = useCallback((): boolean => {
		if (!roomKey) return false;
		const existing = winRef.current;
		if (existing && !existing.closed) { existing.focus(); return true; }
		const b = visibleBounds(readBounds());
		const win = window.open("about:blank", `exxperts-docs-${roomKey}`, `popup=yes,left=${b.x},top=${b.y},width=${b.w},height=${b.h}`);
		if (!win) return false;
		winRef.current = win;
		win.document.title = `${roomName} · Documents`;
		copyAppearance(document, win.document);
		for (const node of Array.from(document.head.querySelectorAll("link[rel=stylesheet], style"))) {
			const copy = node.cloneNode(true) as HTMLElement;
			if (copy instanceof HTMLLinkElement) copy.href = (node as HTMLLinkElement).href;
			win.document.head.appendChild(copy);
		}
		win.document.body.style.margin = "0";
		win.document.body.style.height = "100vh";
		host.classList.add("docs-host-window");
		win.document.body.appendChild(host);
		win.addEventListener("pagehide", () => { if (winRef.current === win) returnToChat(); });
		setDetached(true);
		return true;
	}, [host, roomKey, roomName, returnToChat]);

	// Keep the window's look and its remembered position current while it is open.
	useEffect(() => {
		if (!detached) return;
		const sync = new MutationObserver(() => { const win = winRef.current; if (win && !win.closed) copyAppearance(document, win.document); });
		sync.observe(document.documentElement, { attributes: true });
		const remember = window.setInterval(() => {
			const win = winRef.current;
			if (win && !win.closed) try { localStorage.setItem(BOUNDS_KEY, JSON.stringify({ x: win.screenX, y: win.screenY, w: win.outerWidth, h: win.outerHeight })); } catch {}
		}, 1000);
		return () => { sync.disconnect(); window.clearInterval(remember); };
	}, [detached]);

	// Leaving the room, or closing the chat window, closes the documents window.
	useEffect(() => {
		const onChatClose = () => { const win = winRef.current; winRef.current = null; if (win && !win.closed) win.close(); };
		window.addEventListener("pagehide", onChatClose);
		return () => { window.removeEventListener("pagehide", onChatClose); if (winRef.current) returnToChat(); };
	}, [roomKey, returnToChat]);

	const mountInline = useCallback((el: HTMLElement | null) => {
		inlineRef.current = el;
		if (el && !winRef.current) { host.classList.remove("docs-host-window"); el.appendChild(host); }
	}, [host]);

	return { host, detached, detach, returnToChat, mountInline };
}
