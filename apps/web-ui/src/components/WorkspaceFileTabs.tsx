import { workspaceFileName } from "../workspace-tabs";

interface Props {
	tabs: string[];
	active: string | null;
	onSelect: (path: string) => void;
	onClose: (path: string) => void;
}

export function WorkspaceFileTabs({ tabs, active, onSelect, onClose }: Props) {
	return (
		<div className="workspace-tabs" role="tablist" aria-label="Open files">
			{tabs.map((path) => {
				const name = workspaceFileName(path);
				const selected = path === active;
				return (
					<div className="workspace-tab" key={path} data-active={selected}>
						<button type="button" className="workspace-tab-select" role="tab" aria-selected={selected} title={path} onClick={() => onSelect(path)}>{name}</button>
						<button type="button" className="workspace-tab-close" aria-label={`Close ${name}`} title="Close" onClick={() => onClose(path)}>✕</button>
					</div>
				);
			})}
		</div>
	);
}
