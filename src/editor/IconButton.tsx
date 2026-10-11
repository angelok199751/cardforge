import type { ReactNode } from "react";

interface Props {
  tip: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}

/** Кнопка-значок со всплывающей подсказкой. */
export function IconButton({ tip, active, disabled, onClick, children }: Props) {
  return (
    <button
      type="button"
      className={"icon-btn" + (active ? " active" : "")}
      data-tip={tip}
      aria-label={tip}
      disabled={disabled}
      onClick={onClick}
    >
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </svg>
    </button>
  );
}

const node = (x: number, y: number) => <rect x={x - 2.2} y={y - 2.2} width="4.4" height="4.4" rx="1" fill="currentColor" stroke="none" />;
const dot = (x: number, y: number) => <circle cx={x} cy={y} r="1.9" fill="currentColor" stroke="none" />;

export const ICONS = {
  straight: <path d="M4 19 L20 5" />,
  bezier: (
    <>
      <path d="M3 18 C 9 18, 9 6, 15 6 S 20 9, 21 6" />
      {dot(3, 18)}
      {dot(21, 6)}
    </>
  ),
  corner: (
    <>
      <path d="M4 19 L12 6 L20 19" />
      {node(12, 6)}
    </>
  ),
  mirrored: (
    <>
      <path d="M4 12 H20" />
      {dot(4, 12)}
      {dot(20, 12)}
      {node(12, 12)}
    </>
  ),
  angle: (
    <>
      <path d="M3 12 H21" />
      {dot(3, 12)}
      {dot(21, 12)}
      {node(9, 12)}
    </>
  ),
  free: (
    <>
      <path d="M5 6 L12 12 L20 18" />
      <path d="M12 12 L20 7" />
      {dot(5, 6)}
      {dot(20, 7)}
      {node(12, 12)}
    </>
  ),
  trash: (
    <>
      <path d="M5 7 H19" />
      <path d="M9 7 V5 H15 V7" />
      <path d="M7 7 L8 19 H16 L17 7" />
    </>
  ),
};
