// The viewer inside a preview's sandboxed frame: zoom and move like the picture preview, sheet-style tabs for several pages.
export type CanvasPage = { name: string };
export type ShowPage = (index: number, content: HTMLElement) => Promise<{ width: number; height: number }>;

const MIN_SCALE = 0.02, MAX_SCALE = 32, BUTTON_STEP = 1.25, WHEEL_SPEED = 0.0012, PINCH_SPEED = 0.012, EASING = 0.28, PADDING = 16;

const STYLE = `
html, body { height: 100%; margin: 0; overflow: hidden; font: 12px system-ui, sans-serif; }
html[data-theme="dark"] { --surface: #2f2f2f; --raised: #373737; --hover: #414141; --border: #55504a; --text: #f2f0ec; --desk: #242424; }
html, html[data-theme="light"] { --surface: #fffaf2; --raised: #ebe6dc; --hover: #e2ddd3; --border: #c7c0b6; --text: #171717; --desk: #f3f0ea; }
body { background: var(--desk); color: var(--text); }
#slides { height: 100%; padding: 0; display: flex; flex-direction: column; }
.tools { flex: none; display: flex; align-items: center; justify-content: flex-end; gap: 4px; padding: 4px 16px; border-bottom: 1px solid var(--border); background: var(--surface); }
.tools span { min-width: 44px; text-align: center; font-variant-numeric: tabular-nums; }
.tools button { min-width: 26px; padding: 2px 8px; border: 1px solid var(--border); border-radius: 5px; background: transparent; color: inherit; font: inherit; cursor: pointer; }
.tools button:hover { background: var(--hover); }
.stage { position: relative; flex: 1; min-height: 0; overflow: hidden; cursor: grab; touch-action: none; user-select: none; }
.stage[data-dragging] { cursor: grabbing; }
.content { position: absolute; top: 0; left: 0; transform-origin: 0 0; background: #fff; }
.pages { flex: none; display: flex; gap: 2px; overflow-x: auto; padding: 0 8px; border-top: 1px solid var(--border); background: var(--raised); }
.pages button { flex: none; padding: 6px 14px; border: 0; border-radius: 0 0 4px 4px; background: transparent; color: inherit; font: inherit; cursor: pointer; }
.pages button:hover { background: var(--hover); }
.pages button[aria-pressed="true"] { background: var(--surface); font-weight: 600; }
`;

function button(label: string, onClick: () => void, ariaLabel?: string): HTMLButtonElement {
	const element = document.createElement("button");
	element.type = "button";
	element.textContent = label;
	if (ariaLabel) element.setAttribute("aria-label", ariaLabel);
	element.addEventListener("click", onClick);
	return element;
}

export async function mountCanvas(container: HTMLElement, pages: CanvasPage[], show: ShowPage): Promise<void> {
	document.documentElement.dataset.theme = /theme=dark/.test(location.hash) ? "dark" : "light";
	const style = document.createElement("style");
	style.textContent = STYLE;
	document.head.append(style);

	const label = document.createElement("span");
	label.setAttribute("aria-live", "polite");
	const tools = document.createElement("div");
	tools.className = "tools";
	const stage = document.createElement("div");
	stage.className = "stage";
	const content = document.createElement("div");
	content.className = "content";
	stage.append(content);

	let size = { width: 0, height: 0 };
	let view = { scale: 1, x: 0, y: 0 };
	let target = { scale: 1, anchorX: 0, anchorY: 0 };
	let frame: number | null = null;
	let fitted = true;

	const paint = () => {
		const width = size.width * view.scale, height = size.height * view.scale;
		view.x = width <= stage.clientWidth ? (stage.clientWidth - width) / 2 : Math.min(0, Math.max(stage.clientWidth - width, view.x));
		view.y = height <= stage.clientHeight - PADDING ? PADDING : Math.min(0, Math.max(stage.clientHeight - height, view.y));
		content.style.transform = `translate(${view.x}px, ${view.y}px) scale(${view.scale})`;
		label.textContent = `${Math.round(view.scale * 100)}%`;
	};
	const zoomViewAt = (x: number, y: number, scale: number) => {
		const ratio = scale / view.scale;
		view = { scale, x: x - (x - view.x) * ratio, y: y - (y - view.y) * ratio };
	};
	const step = () => {
		frame = null;
		const remaining = Math.log(target.scale / view.scale);
		const done = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches || Math.abs(remaining) < 0.001;
		zoomViewAt(target.anchorX, target.anchorY, done ? target.scale : view.scale * Math.exp(remaining * EASING));
		paint();
		if (!done) frame = requestAnimationFrame(step);
	};
	const zoomTo = (scale: number, anchorX: number, anchorY: number) => {
		fitted = false;
		target = { scale: Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale)), anchorX, anchorY };
		if (frame === null) frame = requestAnimationFrame(step);
	};
	const centre = (): [number, number] => [stage.clientWidth / 2, stage.clientHeight / 2];
	const fit = () => {
		if (!size.width || !stage.clientWidth || !stage.clientHeight) return;
		fitted = true;
		if (frame !== null) { cancelAnimationFrame(frame); frame = null; }
		const scale = Math.min(1, (stage.clientWidth - PADDING * 2) / size.width, (stage.clientHeight - PADDING * 2) / size.height);
		view = { scale, x: 0, y: 0 };
		target = { scale, anchorX: 0, anchorY: 0 };
		paint();
	};

	tools.append(
		button("−", () => zoomTo(target.scale / BUTTON_STEP, ...centre()), "Zoom out"),
		label,
		button("+", () => zoomTo(target.scale * BUTTON_STEP, ...centre()), "Zoom in"),
		button("100%", () => zoomTo(1, ...centre())),
		button("Fit", fit),
	);

	stage.addEventListener("wheel", (event) => {
		event.preventDefault();
		const box = stage.getBoundingClientRect();
		const delta = event.deltaY * (event.deltaMode === 1 ? 33 : event.deltaMode === 2 ? 100 : 1);
		zoomTo(target.scale * Math.exp(-delta * (event.ctrlKey ? PINCH_SPEED : WHEEL_SPEED)), event.clientX - box.left, event.clientY - box.top);
	}, { passive: false });
	let drag: { x: number; y: number } | null = null;
	stage.addEventListener("pointerdown", (event) => {
		if (event.button !== 0) return;
		stage.setPointerCapture(event.pointerId);
		drag = { x: event.clientX, y: event.clientY };
		stage.dataset.dragging = "true";
	});
	stage.addEventListener("pointermove", (event) => {
		if (!drag) return;
		if (frame !== null) { cancelAnimationFrame(frame); frame = null; target.scale = view.scale; }
		view.x += event.clientX - drag.x;
		view.y += event.clientY - drag.y;
		drag = { x: event.clientX, y: event.clientY };
		paint();
	});
	const endDrag = () => { drag = null; delete stage.dataset.dragging; };
	stage.addEventListener("pointerup", endDrag);
	stage.addEventListener("pointercancel", endDrag);
	stage.addEventListener("dblclick", (event) => {
		if (!fitted) { fit(); return; }
		const box = stage.getBoundingClientRect();
		zoomTo(view.scale < 0.99 ? 1 : 2, event.clientX - box.left, event.clientY - box.top);
	});
	new ResizeObserver(() => { if (fitted) fit(); else paint(); }).observe(stage);

	container.replaceChildren(tools, stage);
	const buttons: HTMLButtonElement[] = [];
	const select = async (index: number) => {
		buttons.forEach((item, position) => item.setAttribute("aria-pressed", String(position === index)));
		size = await show(index, content);
		content.style.width = `${size.width}px`;
		content.style.height = `${size.height}px`;
		fit();
	};
	if (pages.length > 1) {
		const bar = document.createElement("div");
		bar.className = "pages";
		bar.setAttribute("aria-label", "Pages");
		pages.forEach((page, index) => {
			const item = button(page.name, () => void select(index));
			buttons.push(item);
			bar.append(item);
		});
		container.append(bar);
	}
	await select(0);
}
