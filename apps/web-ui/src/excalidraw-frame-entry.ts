// Runs alone inside a preview's sandboxed frame: no app code, no cookies, no network.
import { exportToSvg } from "@excalidraw/excalidraw";
import { mountCanvas } from "./frame-canvas";

type SceneElement = { type?: string; name?: string | null; isDeleted?: boolean };

window.addEventListener("message", (event) => {
	if (event.source !== window.parent || !(event.data instanceof ArrayBuffer)) return;
	const container = document.getElementById("slides");
	if (!container) return;
	void (async () => {
		const scene = JSON.parse(new TextDecoder().decode(event.data));
		const elements: SceneElement[] = scene.elements ?? [];
		// An Excalidraw file has one canvas; its frames are the nearest thing to separate pictures.
		const frames = elements.filter((element) => element.type === "frame" && !element.isDeleted);
		const pages = frames.length > 1 ? frames.map((frame, index) => ({ name: frame.name || `Frame ${index + 1}` })) : [{ name: "Drawing" }];
		const rendered = new Map<number, SVGSVGElement>();
		await mountCanvas(container, pages, async (index, content) => {
			// The frame cannot fetch the hand-drawn fonts; text falls back to a system font.
			const svg = rendered.get(index) ?? await exportToSvg({
				elements: elements as never,
				appState: { ...scene.appState, exportBackground: true },
				files: scene.files ?? null,
				skipInliningFonts: true,
				...(frames.length > 1 ? { exportingFrame: frames[index] as never } : {}),
			});
			rendered.set(index, svg);
			content.replaceChildren(svg);
			return { width: Number(svg.getAttribute("width")) || svg.getBoundingClientRect().width, height: Number(svg.getAttribute("height")) || svg.getBoundingClientRect().height };
		});
	})()
		.then(() => window.parent.postMessage({ kind: "frame-rendered" }, "*"))
		.catch(() => window.parent.postMessage({ kind: "frame-failed" }, "*"));
});
window.parent.postMessage({ kind: "frame-ready" }, "*");
