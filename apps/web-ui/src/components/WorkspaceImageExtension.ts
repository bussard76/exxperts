import { mergeAttributes } from "@tiptap/core";
import { Image } from "@tiptap/extension-image";
import { Link } from "@tiptap/extension-link";
import { Paragraph } from "@tiptap/extension-paragraph";

// The stock parser lifts an image alone in a paragraph out of it, for block images.
// Ours are inline, so that would leave inline content directly in the document, which the editor refuses.
export const WorkspaceParagraph = Paragraph.extend({
	parseMarkdown(token, helpers) {
		const tokens = token.tokens ?? [];
		if (tokens.length === 1 && tokens[0].type === "image") return helpers.createNode("paragraph", undefined, helpers.parseInline(tokens));
		return Paragraph.config.parseMarkdown!.call(this, token, helpers);
	},
});

// Marks only apply to text, so a linked image would lose its link on save. It keeps the link on itself instead.
export const WorkspaceLink = Link.extend({
	parseMarkdown(token, helpers) {
		const tokens = token.tokens ?? [];
		if (tokens.length === 1 && tokens[0].type === "image") {
			return helpers.parseInline(tokens).map((node) => ({
				...node,
				attrs: { ...node.attrs, linkHref: token.href, linkTitle: token.title || null },
			}));
		}
		return Link.config.parseMarkdown!.call(this, token, helpers);
	},
});

function markdownTitle(title: unknown): string {
	return title ? ` "${String(title).replaceAll('"', '\\"')}"` : "";
}

// The node keeps the source from the Markdown, so saving writes it back unchanged;
// only the rendered <img> points at where the browser can load it.
export function createWorkspaceImageExtension(resolveSrcRef: { current: (src: string) => string | null }) {
	return Image.extend({
		addAttributes() {
			return {
				...this.parent?.(),
				linkHref: { default: null, rendered: false },
				linkTitle: { default: null, rendered: false },
			};
		},
		renderHTML({ HTMLAttributes }) {
			const src = resolveSrcRef.current(String(HTMLAttributes.src ?? "")) ?? "";
			return ["img", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { src })];
		},
		// The stock serialiser drops the <…> a source with spaces needs, which breaks the image on the next load.
		renderMarkdown(node) {
			const src = String(node.attrs?.src ?? "");
			const destination = /\s/.test(src) ? `<${src}>` : src;
			const image = `![${String(node.attrs?.alt ?? "")}](${destination}${markdownTitle(node.attrs?.title)})`;
			return node.attrs?.linkHref ? `[${image}](${node.attrs.linkHref}${markdownTitle(node.attrs.linkTitle)})` : image;
		},
	}).configure({ inline: true });
}
