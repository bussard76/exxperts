export function WorkspaceFileTabs({ tabs, active, onSelect, onClose }: { tabs: string[]; active: string | null; onSelect: (path: string) => void; onClose: (path: string) => void }) {
	return <div className="workspace-tabs" role="tablist" aria-label="Open files">
		{tabs.map((path) => {
			const name = path.split("/").pop() || path;
			return <div className="workspace-tab" key={path} data-active={path === active}>
				<button type="button" className="workspace-tab-select" role="tab" aria-selected={path === active} title={path} onClick={() => onSelect(path)}>{name}</button>
				<button type="button" className="workspace-tab-close" aria-label={`Close ${name}`} onClick={() => onClose(path)}>×</button>
			</div>;
		})}
	</div>;
}
