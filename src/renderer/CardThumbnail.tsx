import type { AssetLibrary, CardElement, CardSettings, DataRow } from "../types";
import { CardRenderer } from "../renderer/CardRenderer";

interface CardThumbnailProps {
  card: CardSettings;
  elements: CardElement[];
  dataRow?: DataRow;
  assets?: AssetLibrary;
  targetWidth: number;
}

export function CardThumbnail({ card, elements, dataRow, assets, targetWidth }: CardThumbnailProps) {
  const scale = targetWidth / card.width;
  const targetHeight = card.height * scale;

  return (
    <div style={{ width: targetWidth, height: targetHeight, overflow: "hidden", flexShrink: 0 }}>
      <div style={{ width: card.width, height: card.height, transform: `scale(${scale})`, transformOrigin: "top left" }}>
        <CardRenderer card={card} elements={elements} dataRow={dataRow} assets={assets} />
      </div>
    </div>
  );
}
