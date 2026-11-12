import { useCallback, useState } from "react";

// The chat owns both portal elements; their contents stay in the same React tree.
export function useDocumentsHost() {
	const [host] = useState(() => {
		const element = document.createElement("div");
		element.className = "docs-host";
		return element;
	});
	const [treeHost] = useState(() => {
		const element = document.createElement("div");
		element.style.display = "contents";
		return element;
	});
	const mountHost = useCallback((slot: HTMLDivElement | null) => {
		if (slot) slot.appendChild(host);
	}, [host]);
	const mountTree = useCallback((slot: HTMLDivElement | null) => {
		if (slot) slot.appendChild(treeHost);
	}, [treeHost]);
	// Opening is separate from adoption: the owner keeps authority until every
	// stylesheet has loaded and the caller has revalidated its transfer stamp.
	const beginChild = useCallback(async (frameName: string, title: string) => {
		const child = window.open("about:blank", frameName, "popup,width=900,height=700");
		if (!child) return null;
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
			const treeSlot = target.createElement("div");
			treeSlot.className = "documents-child-tree";
			const paneSlot = target.createElement("div");
			paneSlot.className = "documents-child-pane";
			layout.append(treeSlot, paneSlot);
			target.body.replaceChildren(layout);
			await Promise.race([
				Promise.all(pending),
				new Promise<never>((_, reject) => { timer = window.setTimeout(() => reject(new Error("Stylesheet timeout")), 10_000); }),
			]);
			if (child.closed || child.opener !== window || child.location.href !== "about:blank" || child.document !== target || target.defaultView !== child || child.getComputedStyle(layout).display !== "grid" || !layout.getBoundingClientRect().width || !layout.getBoundingClientRect().height) throw new Error("Child not ready");
			return { child, treeSlot, paneSlot };
		} catch {
			if (verified) { try { child.close(); } catch {} }
			return null;
		} finally {
			if (timer !== null) window.clearTimeout(timer);
		}
	}, []);
	return { host, treeHost, mountHost, mountTree, beginChild };
}
