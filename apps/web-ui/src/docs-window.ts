import { useCallback, useEffect, useRef, useState } from "react";

type PreparedChild = { child: Window; document: Document; hostSlot: HTMLElement; returnButton: HTMLButtonElement };

// The chat owns one portal element; its contents stay in the same React tree.
export function useDocumentsHost() {
	const [host] = useState(() => {
		const element = document.createElement("div");
		element.className = "docs-host";
		return element;
	});
	const ownerHostSlot = useRef<HTMLDivElement | null>(null);
	const ownerTreeSlot = useRef<HTMLDivElement | null>(null);
	const treeResizeRef = useRef<ResizeObserver | null>(null);
	const updateTreeRef = useRef<() => void>(() => {});
	const lastBounds = useRef<{ left: number; top: number; width: number; height: number } | null>(null);
	const opening = useRef(false);
	const prepared = useRef<PreparedChild | null>(null);
	const registered = useRef<PreparedChild | null>(null);
	const mountHost = useCallback((slot: HTMLDivElement | null) => {
		ownerHostSlot.current = slot;
		if (slot && !registered.current) slot.appendChild(host);
	}, [host]);
	const mountTree = useCallback((slot: HTMLDivElement | null) => {
		if (ownerTreeSlot.current) treeResizeRef.current?.unobserve(ownerTreeSlot.current);
		ownerTreeSlot.current = slot;
		if (slot) treeResizeRef.current?.observe(slot);
		updateTreeRef.current();
	}, []);
	useEffect(() => {
		const update = () => {
			const slot = ownerTreeSlot.current;
			if (!slot) return;
			const rect = slot.getBoundingClientRect();
			for (const [name, value] of Object.entries({ left: rect.left, top: rect.top, width: rect.width, height: rect.height })) host.style.setProperty(`--docs-tree-${name}`, `${value}px`);
		};
		updateTreeRef.current = update;
		const resize = new ResizeObserver(update);
		treeResizeRef.current = resize;
		const mutation = new MutationObserver(update);
		const slot = ownerTreeSlot.current;
		if (slot) resize.observe(slot);
		mutation.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style"] });
		window.addEventListener("resize", update);
		document.addEventListener("scroll", update, true);
		update();
		return () => { treeResizeRef.current = null; updateTreeRef.current = () => {}; resize.disconnect(); mutation.disconnect(); window.removeEventListener("resize", update); document.removeEventListener("scroll", update, true); };
	}, [host]);
	// Opening is separate from adoption: the owner keeps authority until every
	// stylesheet has loaded and the caller has revalidated its transfer stamp.
	const beginChild = useCallback(async (frameName: string, title: string) => {
		if (opening.current || prepared.current || registered.current) return null;
		opening.current = true;
		let child: Window | null;
		try {
			const screen = window.screen as Screen & { availLeft?: number; availTop?: number };
			const hasOrigin = typeof screen.availLeft === "number" && Number.isFinite(screen.availLeft) && typeof screen.availTop === "number" && Number.isFinite(screen.availTop);
			const hasArea = hasOrigin && Number.isFinite(screen.availWidth) && screen.availWidth > 0 && Number.isFinite(screen.availHeight) && screen.availHeight > 0;
			const areaLeft = hasOrigin ? screen.availLeft! : 0;
			const areaTop = hasOrigin ? screen.availTop! : 0;
			const width = Math.round(hasArea ? Math.min(lastBounds.current?.width ?? 900, screen.availWidth) : 900);
			const height = Math.round(hasArea ? Math.min(lastBounds.current?.height ?? 700, screen.availHeight) : 700);
			const wantedLeft = (hasArea ? lastBounds.current?.left : undefined) ?? (Number.isFinite(window.screenX) ? window.screenX + 40 : 0);
			const wantedTop = (hasArea ? lastBounds.current?.top : undefined) ?? (Number.isFinite(window.screenY) ? window.screenY + 40 : 0);
			const left = Math.round(hasArea ? Math.max(areaLeft, Math.min(wantedLeft, areaLeft + screen.availWidth - width)) : wantedLeft);
			const top = Math.round(hasArea ? Math.max(areaTop, Math.min(wantedTop, areaTop + screen.availHeight - height)) : wantedTop);
			child = window.open("about:blank", frameName, `popup,width=${width},height=${height},left=${left},top=${top}`);
		} catch { opening.current = false; return null; }
		if (!child) { opening.current = false; return null; }
		let timer: number | null = null;
		let verified = false;
		try {
			if (child.closed || child.opener !== window || child.location.href !== "about:blank" || child.name !== frameName) throw new Error("Invalid child");
			verified = true;
			const target = child.document;
			for (const attribute of [...document.documentElement.attributes]) target.documentElement.setAttribute(attribute.name, attribute.value);
			target.title = title;
			target.body.className = `${document.body.className} documents-child`;
			const pending: Promise<void>[] = [];
			for (const source of document.head.querySelectorAll('link[rel~="stylesheet"], style, meta[http-equiv="Content-Security-Policy" i]')) {
				const copy = source.cloneNode(true) as HTMLElement;
				if (copy instanceof HTMLLinkElement) {
					copy.href = (source as HTMLLinkElement).href;
					pending.push(new Promise<void>((resolve, reject) => {
						copy.addEventListener("load", () => resolve(), { once: true });
						copy.addEventListener("error", () => reject(new Error("Stylesheet failed")), { once: true });
					}));
				}
				target.head.appendChild(copy);
			}
			if (!pending.length && !target.head.querySelector("style")) throw new Error("No styles");
			const layout = target.createElement("main");
			layout.className = "documents-child-layout";
			const bar = target.createElement("header");
			bar.className = "documents-child-bar";
			const heading = target.createElement("span");
			heading.textContent = title;
			const returnButton = target.createElement("button");
			returnButton.type = "button";
			returnButton.textContent = "Return";
			returnButton.disabled = true;
			bar.append(heading, returnButton);
			layout.append(bar);
			target.body.replaceChildren(layout);
			await Promise.race([
				Promise.all(pending),
				new Promise<never>((_, reject) => { timer = window.setTimeout(() => reject(new Error("Stylesheet timeout")), 10_000); }),
			]);
			if (child.closed || child.opener !== window || child.location.href !== "about:blank" || child.document !== target || target.defaultView !== child || child.getComputedStyle(layout).display !== "grid" || !layout.getBoundingClientRect().width || !layout.getBoundingClientRect().height) throw new Error("Child not ready");
			const result = { child, document: target, hostSlot: layout, returnButton };
			prepared.current = result;
			return result;
		} catch {
			if (verified) { try { child.close(); } catch {} }
			return null;
		} finally {
			if (timer !== null) window.clearTimeout(timer);
			opening.current = false;
		}
	}, []);
	const abortChild = useCallback((candidate: PreparedChild) => {
		if (prepared.current !== candidate) return;
		prepared.current = null;
		try { candidate.child.close(); } catch {}
	}, []);
	// The caller holds the owner arbiter and fences input before either move.
	const moveToChild = useCallback((candidate: PreparedChild, current: () => boolean): "moved" | "refused" | "unknown" => {
		const hostSlot = ownerHostSlot.current, treeSlot = ownerTreeSlot.current;
		if (prepared.current !== candidate || registered.current || !hostSlot || !treeSlot || host.parentNode !== hostSlot || !current()) return "refused";
		try {
			if (candidate.child.closed || candidate.child.opener !== window || candidate.child.document !== candidate.document || candidate.document.defaultView !== candidate.child || candidate.child.location.href !== "about:blank" || !current()) return "refused";
			candidate.hostSlot.appendChild(candidate.document.adoptNode(host));
			if (!current()) throw new Error("Transfer invalidated");
			prepared.current = null;
			registered.current = candidate;
			return "moved";
		} catch {
			try {
				hostSlot.appendChild(document.adoptNode(host));
				return "refused";
			} catch { return "unknown"; }
		}
	}, [host]);
	const moveToOwner = useCallback((candidate: PreparedChild, current: () => boolean): "moved" | "refused" | "unknown" => {
		const hostSlot = ownerHostSlot.current, treeSlot = ownerTreeSlot.current;
		if (registered.current !== candidate || !hostSlot || !treeSlot || !current()) return "refused";
		try {
			if (!candidate.child.closed && (candidate.child.opener !== window || candidate.child.document !== candidate.document)) return "unknown";
			if (host.ownerDocument !== candidate.document || !current()) return "unknown";
			hostSlot.appendChild(document.adoptNode(host));
			try {
				if (!candidate.child.closed) {
					const { screenX: left, screenY: top, innerWidth: width, innerHeight: height } = candidate.child;
					if ([left, top, width, height].every(Number.isFinite) && width > 0 && height > 0) lastBounds.current = { left, top, width, height };
				}
			} catch {}
			return "moved";
		} catch { return "unknown"; }
	}, [host]);
	const recoverToOwner = useCallback((candidate: PreparedChild, current: () => boolean): "moved" | "refused" | "unknown" => {
		const hostSlot = ownerHostSlot.current, treeSlot = ownerTreeSlot.current;
		if ((prepared.current !== candidate && registered.current !== candidate) || !hostSlot || !treeSlot || !current()) return "refused";
		try {
			if (!candidate.child.closed && (candidate.child.opener !== window || candidate.child.document !== candidate.document)) return "unknown";
			if ((host.ownerDocument !== document && host.ownerDocument !== candidate.document) || !current()) return "unknown";
			hostSlot.appendChild(document.adoptNode(host));
			prepared.current = null;
			registered.current = candidate;
			return "moved";
		} catch { return "unknown"; }
	}, [host]);
	const childClosed = useCallback((candidate: PreparedChild) => {
		if (registered.current !== candidate || !candidate.child.closed || host.ownerDocument !== document) return false;
		registered.current = null;
		return true;
	}, [host]);
	return { host, mountHost, mountTree, beginChild, abortChild, moveToChild, moveToOwner, recoverToOwner, childClosed };
}
