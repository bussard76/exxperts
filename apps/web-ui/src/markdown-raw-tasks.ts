// RAW Markdown: the task button works on the text itself. Each press moves the
// selected lines one step round plain/bullet -> "[ ]" -> "[x]" -> plain. The
// first non-empty line decides the step, so a mixed selection ends up uniform.

export interface TaskToggleResult {
	value: string;
	selectionStart: number;
	selectionEnd: number;
}

const TASK = /^(\s*(?:[-*+]|\d+[.)])\s+)\[( |x|X)\](?:\s+|$)/;
const BULLET = /^(\s*(?:[-*+]|\d+[.)])\s+)/;

type Step = "open" | "done" | "plain";

function nextStep(line: string): Step {
	const task = TASK.exec(line);
	if (!task) return "open";
	return task[2] === " " ? "done" : "plain";
}

function applyStep(line: string, step: Step): string {
	const task = TASK.exec(line);
	if (step === "plain") return task ? (/^\s*/.exec(line)?.[0] ?? "") + line.slice(task[0].length) : line;
	const mark = step === "done" ? "[x]" : "[ ]";
	if (task) return task[1] + mark + " " + line.slice(task[0].length);
	const bullet = BULLET.exec(line);
	if (bullet) return bullet[1] + mark + " " + line.slice(bullet[0].length);
	const indent = /^\s*/.exec(line)?.[0] ?? "";
	return indent + "- " + mark + " " + line.slice(indent.length);
}

export function cycleTaskLines(value: string, start: number, end: number): TaskToggleResult {
	const from = Math.min(start, end);
	// A selection that only reaches the start of a line does not include that line.
	let to = Math.max(start, end);
	if (to > from && value[to - 1] === "\n") to -= 1;
	const blockStart = value.lastIndexOf("\n", from - 1) + 1;
	const lineEnd = value.indexOf("\n", to);
	const blockEnd = lineEnd === -1 ? value.length : lineEnd;
	const lines = value.slice(blockStart, blockEnd).split("\n");
	const firstLine = lines.find((line) => line.trim() !== "");
	if (firstLine === undefined) return { value, selectionStart: start, selectionEnd: end };
	const step = nextStep(firstLine);
	const changed = lines.map((line) => (line.trim() === "" ? line : applyStep(line, step))).join("\n");
	const next = value.slice(0, blockStart) + changed + value.slice(blockEnd);
	if (start === end) {
		const caret = blockStart + changed.length;
		return { value: next, selectionStart: caret, selectionEnd: caret };
	}
	return { value: next, selectionStart: blockStart, selectionEnd: blockStart + changed.length };
}
