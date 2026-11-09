// The RAW toolbar's task button cycles the selected lines: plain or bullet -> "[ ]" -> "[x]" -> plain.
import { cycleTaskLines } from "../../web-ui/src/markdown-raw-tasks.js";

function assert(condition: unknown, message: string): asserts condition {
	if (!condition) throw new Error(message);
}

const run = (value: string, start: number, end = start) => cycleTaskLines(value, start, end).value;

// One line, caret anywhere in it: three presses go round the cycle.
const first = run("buy milk", 3);
assert(first === "- [ ] buy milk", `a plain line becomes an open task, got ${JSON.stringify(first)}`);
const second = run(first, 4);
assert(second === "- [x] buy milk", `an open task becomes done, got ${JSON.stringify(second)}`);
const third = run(second, 4);
assert(third === "buy milk", `a done task goes back to plain, got ${JSON.stringify(third)}`);

// A bullet keeps its bullet; other markers and indentation are kept too.
assert(run("- a", 0) === "- [ ] a", "a bullet gains the checkbox");
assert(run("* a", 0) === "* [ ] a", "the bullet character is kept");
assert(run("1. a", 0) === "1. [ ] a", "an ordered item gains the checkbox");
assert(run("  - [ ] nested", 0) === "  - [x] nested", "indentation is kept");
assert(run("    deep", 0) === "    - [ ] deep", "indentation is kept in front of a new bullet");
assert(run("- [X] shout", 0) === "shout", "an upper-case X counts as done");

// Several selected lines all take the same next state; empty lines stay empty.
const block = "a\n\nb\nc";
assert(run(block, 0, block.length) === "- [ ] a\n\n- [ ] b\n- [ ] c", "every non-empty selected line becomes a task");
assert(run("- [ ] a\n- [ ] b", 0, 15) === "- [x] a\n- [x] b", "the whole selection moves together");
assert(run("- [x] a\nb", 0, 9) === "a\nb", "the first line decides the next state");

// A selection that ends at the start of a line does not touch that line.
assert(run("a\nb\n", 0, 2) === "- [ ] a\nb\n", "the line the selection only touches at its start is left alone");
// Text outside the selected lines is untouched.
assert(run("keep\nswitch\nkeep", 6, 6) === "keep\n- [ ] switch\nkeep", "only the caret's line changes");

// The caret stays on the changed line; a selection covers the changed lines.
const caret = cycleTaskLines("ab\ncd", 1, 1);
assert(caret.selectionStart === caret.selectionEnd && caret.value.slice(0, caret.selectionStart) === "- [ ] ab", "the caret ends behind the changed line");
const range = cycleTaskLines("a\nb", 0, 3);
assert(range.value.slice(range.selectionStart, range.selectionEnd) === "- [ ] a\n- [ ] b", "a selection still covers the changed lines");

console.log("markdown raw tasks smoke passed");
