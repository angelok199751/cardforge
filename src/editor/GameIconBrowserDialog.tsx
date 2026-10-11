import { useState } from "react";
import { useProjectStore } from "../state/projectStore";
import { GAME_ICONS_CATALOG, gameIconUrl } from "../data/gameIconsCatalog";
import { fetchAndEmbedIcon } from "../renderer/fetchGameIcon";

interface GameIconBrowserDialogProps {
  onClose: () => void;
}

type AddStatus = "idle" | "adding" | "added" | "added-linked" | "error";

export function GameIconBrowserDialog({ onClose }: GameIconBrowserDialogProps) {
  const uploadAssets = useProjectStore((s) => s.uploadAssets);
  const [statuses, setStatuses] = useState<Record<string, AddStatus>>({});
  const [manualAuthor, setManualAuthor] = useState("");
  const [manualName, setManualName] = useState("");

  async function handleAdd(author: string, name: string) {
    const key = `${author}/${name}`;
    setStatuses((s) => ({ ...s, [key]: "adding" }));
    try {
      const url = gameIconUrl(author, name);
      const result = await fetchAndEmbedIcon(url);
      uploadAssets([{ name: `${author}-${name}.svg`, dataUrl: result.dataUrl }]);
      setStatuses((s) => ({ ...s, [key]: result.embedded ? "added" : "added-linked" }));
    } catch {
      setStatuses((s) => ({ ...s, [key]: "error" }));
    }
  }

  const manualKey = manualAuthor && manualName ? `${manualAuthor}/${manualName}` : null;
  const manualStatus = manualKey ? statuses[manualKey] : undefined;

  const categories = Array.from(new Set(GAME_ICONS_CATALOG.map((i) => i.category)));

  function statusLabel(status: AddStatus | undefined) {
    if (status === "adding") return "Adding…";
    if (status === "added") return "Added ✓";
    if (status === "added-linked") return "Added (linked) ✓";
    if (status === "error") return "Failed";
    return "Add";
  }

  return (
    <div className="modal-overlay">
      <div className="modal modal-wide">
        <h2 className="modal-title">Browse game-icons.net</h2>
        <p className="hint-text">
          Free, CC BY 3.0 icons — thousands of weapons, armor, potions, creatures, and more. Adding one tries to
          embed a permanent local copy; if that's blocked it falls back to a live link, which still works but needs
          internet at export time. Either way it lands in your asset library like anything else.
        </p>

        {categories.map((category) => (
          <section className="panel-section" key={category}>
            <h4 className="panel-section-title">{category}</h4>
            <div className="icon-browser-grid">
              {GAME_ICONS_CATALOG.filter((i) => i.category === category).map((icon) => {
                const key = `${icon.author}/${icon.name}`;
                const status = statuses[key];
                return (
                  <div key={key} className="icon-browser-item">
                    <img src={gameIconUrl(icon.author, icon.name)} alt={icon.label} className="icon-browser-thumb" />
                    <span className="asset-name" title={icon.label}>
                      {icon.label}
                    </span>
                    <button
                      className="btn-ghost"
                      style={{ width: "100%" }}
                      disabled={status === "adding" || status === "added" || status === "added-linked"}
                      onClick={() => handleAdd(icon.author, icon.name)}
                    >
                      {statusLabel(status)}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        <section className="panel-section">
          <h4 className="panel-section-title">Add any icon by author/name</h4>
          <p className="hint-text">
            Browse <a href="https://game-icons.net" target="_blank" rel="noreferrer">game-icons.net</a>, open any
            icon, and copy the author and name from its page URL — e.g. game-icons.net/1x1/
            <strong>delapouite</strong>/<strong>jeep</strong>.html.
          </p>
          <div className="field-row">
            <label className="field">
              <span className="field-label">Author</span>
              <input
                className="text-input mono"
                placeholder="delapouite"
                value={manualAuthor}
                onChange={(e) => setManualAuthor(e.target.value.trim())}
              />
            </label>
            <label className="field">
              <span className="field-label">Icon name</span>
              <input
                className="text-input mono"
                placeholder="jeep"
                value={manualName}
                onChange={(e) => setManualName(e.target.value.trim())}
              />
            </label>
          </div>

          {manualAuthor && manualName && (
            <div className="icon-browser-item" style={{ width: 100 }}>
              <img
                src={gameIconUrl(manualAuthor, manualName)}
                alt=""
                className="icon-browser-thumb"
                onError={(e) => {
                  e.currentTarget.style.visibility = "hidden";
                }}
              />
              <button
                className="btn-ghost"
                style={{ width: "100%" }}
                disabled={manualStatus === "adding" || manualStatus === "added" || manualStatus === "added-linked"}
                onClick={() => handleAdd(manualAuthor, manualName)}
              >
                {statusLabel(manualStatus)}
              </button>
            </div>
          )}
        </section>

        <p className="hint-text warning">
          CC BY 3.0 requires credit: "Icons made by [author]. Available on https://game-icons.net" — worth keeping a
          note of that if you publish or print the finished cards.
        </p>

        <div className="modal-actions">
          <button className="btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
