import { useEffect, useState } from "react";
import { TopBar } from "./editor/TopBar";
import { ToolsPanel } from "./editor/ToolsPanel";
import { LayersPanel } from "./editor/LayersPanel";
import { Canvas } from "./editor/Canvas";
import { CardPropertiesPanel } from "./editor/CardPropertiesPanel";
import { ElementPropertiesPanel } from "./editor/ElementPropertiesPanel";
import { MultiSelectionPanel } from "./editor/MultiSelectionPanel";
import { NewProjectDialog } from "./editor/NewProjectDialog";
import { DataTablePanel } from "./editor/DataTablePanel";
import { PreviewGrid } from "./editor/PreviewGrid";
import { RestoreSessionDialog } from "./editor/RestoreSessionDialog";
import { LandingPage } from "./editor/LandingPage";
import { useProjectStore } from "./state/projectStore";
import { attachAutosave, clearAutosavedProject, loadAutosavedProject } from "./storage/autosave";
import { attachHistory, redo, resetHistory, undo } from "./state/history";
import type { Project } from "./types";

const LANDING_SEEN_KEY = "cardforge-seen-landing";

export default function App() {
  const [showNewProject, setShowNewProject] = useState(false);
  const [autosavedProject, setAutosavedProject] = useState<Project | null>(null);
  const [showLanding, setShowLanding] = useState(() => {
    try {
      return !localStorage.getItem(LANDING_SEEN_KEY);
    } catch {
      return true;
    }
  });
  const view = useProjectStore((s) => s.view);
  const elements = useProjectStore((s) => s.project.elements);
  const selectedElementIds = useProjectStore((s) => s.selectedElementIds);
  const loadProject = useProjectStore((s) => s.loadProject);
  const selectedElements = elements.filter((el) => selectedElementIds.includes(el.id));

  // Once on mount: start debounce-persisting every change, and check whether
  // there's a session from a previous visit worth offering to restore.
  useEffect(() => {
    const unsubscribeAutosave = attachAutosave();
    const unsubscribeHistory = attachHistory();
    let cancelled = false;

    loadAutosavedProject().then((project) => {
      if (cancelled || !project) return;
      const hasContent = project.elements.length > 0 || project.data.rows.length > 0;
      if (hasContent) setAutosavedProject(project);
    });

    return () => {
      cancelled = true;
      unsubscribeAutosave();
      unsubscribeHistory();
    };
  }, []);

  // Global undo/redo shortcuts — work from any view, not just while an
  // element is selected on the canvas.
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const isTyping = target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
      if (isTyping) return;

      const isMod = e.metaKey || e.ctrlKey;
      if (!isMod || e.key.toLowerCase() !== "z") return;
      e.preventDefault();
      if (e.shiftKey) redo();
      else undo();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function handleRestore() {
    if (!autosavedProject) return;
    loadProject(autosavedProject);
    resetHistory();
    setAutosavedProject(null);
  }

  function handleDiscard() {
    setAutosavedProject(null);
    clearAutosavedProject();
  }

  function handleEnterBuilder() {
    try {
      localStorage.setItem(LANDING_SEEN_KEY, "1");
    } catch {
      // localStorage unavailable (private browsing, etc.) — just proceed without remembering.
    }
    setShowLanding(false);
  }

  if (showLanding) {
    return <LandingPage onEnter={handleEnterBuilder} />;
  }

  return (
    <div className="app-shell">
      <TopBar onNewProject={() => setShowNewProject(true)} onShowAbout={() => setShowLanding(true)} />

      {view === "template" && (
        <div className="app-body">
          <div className="left-column">
            <ToolsPanel />
            <LayersPanel />
          </div>
          <Canvas />
          {selectedElements.length === 1 ? (
            <ElementPropertiesPanel key={selectedElements[0].id} element={selectedElements[0]} />
          ) : selectedElements.length > 1 ? (
            <MultiSelectionPanel ids={selectedElementIds} />
          ) : (
            <CardPropertiesPanel />
          )}
        </div>
      )}

      {view === "data" && (
        <div className="app-body app-body-full">
          <DataTablePanel />
        </div>
      )}

      {view === "preview" && (
        <div className="app-body app-body-full">
          <PreviewGrid />
        </div>
      )}

      {showNewProject && <NewProjectDialog onClose={() => setShowNewProject(false)} />}

      {autosavedProject && (
        <RestoreSessionDialog project={autosavedProject} onRestore={handleRestore} onDiscard={handleDiscard} />
      )}
    </div>
  );
}
