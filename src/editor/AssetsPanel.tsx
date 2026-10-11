import { useRef } from "react";
import { useProjectStore } from "../state/projectStore";

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Не удалось прочитать файл"));
    reader.readAsDataURL(file);
  });
}

export function AssetsPanel() {
  const assets = useProjectStore((s) => s.project.assets);
  const uploadAssets = useProjectStore((s) => s.uploadAssets);
  const removeAsset = useProjectStore((s) => s.removeAsset);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const names = Object.keys(assets ?? {}).sort((a, b) => a.localeCompare(b));

  async function handleFiles(fileList: FileList) {
    const files = Array.from(fileList);
    const loaded = await Promise.all(
      files.map(async (file) => ({ name: file.name, dataUrl: await readAsDataUrl(file) }))
    );
    uploadAssets(loaded);
  }

  return (
    <div className="assets-panel">
      <div className="data-view-header">
        <div>
          <h3 className="panel-title" style={{ marginBottom: 4 }}>
            Библиотека изображений
          </h3>
          <p className="hint-text">
            Загружайте изображения сюда, а затем ссылайтесь на них по точному имени файла в привязке к данным
            Image-элемента — например, колонка со значением "goblin.png" совпадёт с файлом, загруженным как
            goblin.png.
          </p>
        </div>
        <div className="data-view-actions">
          <button className="btn-ghost" onClick={() => fileInputRef.current?.click()}>
            Загрузить изображения
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            multiple
            style={{ display: "none" }}
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      {names.length > 0 && (
        <div className="asset-grid">
          {names.map((name) => (
            <div key={name} className="asset-item">
              <div className="asset-thumb" style={{ backgroundImage: `url(${assets[name]})` }} />
              <span className="asset-name" title={name}>
                {name}
              </span>
              <button className="layer-action-btn danger" title="Удалить" onClick={() => removeAsset(name)}>
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
