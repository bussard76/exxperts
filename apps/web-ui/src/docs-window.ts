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
	return { host, treeHost, mountHost, mountTree };
}
