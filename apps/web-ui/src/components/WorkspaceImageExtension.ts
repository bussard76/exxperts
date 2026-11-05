import { mergeAttributes } from "@tiptap/core";
import { Image } from "@tiptap/extension-image";

// The node keeps the source from the Markdown, so saving writes it back unchanged;
// only the rendered <img> points at where the browser can load it.
export function createWorkspaceImageExtension(resolveSrcRef: { current: (src: string) => string | null }) {
	return Image.extend({
		renderHTML({ HTMLAttributes }) {
			const src = resolveSrcRef.current(String(HTMLAttributes.src ?? "")) ?? "";
			return ["img", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { src })];
		},
		// The stock serialiser drops the <…> a source with spaces needs, which breaks the image on the next load.
		renderMarkdown(node) {
			const src = String(node.attrs?.src ?? "");
			const destination = /\s/.test(src) ? `<${src}>` : src;
			const title = node.attrs?.title ? ` "${String(node.attrs.title).replaceAll('"', '\\"')}"` : "";
			return `![${String(node.attrs?.alt ?? "")}](${destination}${title})`;
		},
	}).configure({ inline: true });
}
