import { FlipHorizontal2, LocateFixed, Maximize2, Minimize2, Minus, Plus, RotateCcw, RotateCw, RotateCwSquare } from "lucide-react";

function ToolButton({ label, icon: Icon, onClick, disabled }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="flex size-10 items-center justify-center text-ink transition-colors hover:bg-surface disabled:text-slate-300"
    >
      <Icon className="size-[18px]" />
    </button>
  );
}

function ToolGroup({ children }) {
  return (
    <div className="flex flex-col divide-y divide-line overflow-hidden rounded-xl border border-line bg-white shadow-md">
      {children}
    </div>
  );
}

export function MapToolbar({ canEdit, isFullscreen, onRotate, onFlip, onRecenter, onZoomIn, onZoomOut, onToggleFullscreen }) {
  return (
    <div className="absolute top-3 left-3 z-[1000] flex flex-col gap-2">
      <ToolGroup>
        <ToolButton label="Rotate left 15°" icon={RotateCcw} onClick={() => onRotate(-15)} disabled={!canEdit} />
        <ToolButton label="Rotate right 15°" icon={RotateCw} onClick={() => onRotate(15)} disabled={!canEdit} />
        <ToolButton label="Rotate 90°" icon={RotateCwSquare} onClick={() => onRotate(90)} disabled={!canEdit} />
        <ToolButton label="Flip floor plan" icon={FlipHorizontal2} onClick={onFlip} disabled={!canEdit} />
        <ToolButton label="Reset position" icon={LocateFixed} onClick={onRecenter} disabled={!canEdit} />
      </ToolGroup>
      <ToolGroup>
        <ToolButton label="Zoom in" icon={Plus} onClick={onZoomIn} />
        <ToolButton label="Zoom out" icon={Minus} onClick={onZoomOut} />
        <ToolButton
          label={isFullscreen ? "Exit full screen" : "Full screen"}
          icon={isFullscreen ? Minimize2 : Maximize2}
          onClick={onToggleFullscreen}
        />
      </ToolGroup>
    </div>
  );
}
