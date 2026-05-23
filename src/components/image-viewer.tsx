import { useEffect, useRef, useState, type TouchEvent, type WheelEvent } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

interface Props {
  src: string;
  alt?: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function ImageViewer({ src, alt, open, onOpenChange }: Props) {
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const dragRef = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);
  const pinchRef = useRef<{ dist: number; scale: number } | null>(null);

  useEffect(() => {
    if (open) { setScale(1); setTx(0); setTy(0); }
  }, [open]);

  const clamp = (s: number) => Math.min(5, Math.max(1, s));

  const onWheel = (e: WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    setScale((s) => clamp(s - e.deltaY * 0.002));
  };

  const onTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      const [a, b] = [e.touches[0], e.touches[1]];
      pinchRef.current = { dist: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), scale };
    } else if (e.touches.length === 1 && scale > 1) {
      dragRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, tx, ty };
    }
  };
  const onTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && pinchRef.current) {
      const [a, b] = [e.touches[0], e.touches[1]];
      const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      setScale(clamp(pinchRef.current.scale * (d / pinchRef.current.dist)));
    } else if (e.touches.length === 1 && dragRef.current) {
      setTx(dragRef.current.tx + (e.touches[0].clientX - dragRef.current.x));
      setTy(dragRef.current.ty + (e.touches[0].clientY - dragRef.current.y));
    }
  };
  const onTouchEnd = () => { dragRef.current = null; pinchRef.current = null; };

  const onMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    dragRef.current = { x: e.clientX, y: e.clientY, tx, ty };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current) return;
    setTx(dragRef.current.tx + (e.clientX - dragRef.current.x));
    setTy(dragRef.current.ty + (e.clientY - dragRef.current.y));
  };
  const onMouseUp = () => { dragRef.current = null; };

  const reset = () => { setScale(1); setTx(0); setTy(0); };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-none w-screen h-screen p-0 border-0 bg-black/95 sm:rounded-none">
        <div
          className="relative flex h-full w-full items-center justify-center overflow-hidden touch-none select-none"
          onWheel={onWheel}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onDoubleClick={() => setScale((s) => (s > 1 ? 1 : 2.5))}
        >
          <img
            src={src}
            alt={alt ?? "Preview"}
            draggable={false}
            className="max-h-full max-w-full object-contain transition-transform duration-100"
            style={{ transform: `translate(${tx}px, ${ty}px) scale(${scale})`, cursor: scale > 1 ? "grab" : "zoom-in" }}
          />
          <div
            className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-black/60 px-3 py-2 backdrop-blur"
            style={{ bottom: "calc(env(safe-area-inset-bottom) + 1rem)" }}
          >
            <Button size="icon" variant="ghost" className="h-10 w-10 text-white hover:bg-white/10" onClick={() => setScale((s) => clamp(s - 0.5))} aria-label="Zoom out"><ZoomOut className="h-5 w-5" /></Button>
            <span className="min-w-[3rem] text-center text-xs font-medium text-white">{Math.round(scale * 100)}%</span>
            <Button size="icon" variant="ghost" className="h-10 w-10 text-white hover:bg-white/10" onClick={() => setScale((s) => clamp(s + 0.5))} aria-label="Zoom in"><ZoomIn className="h-5 w-5" /></Button>
            <Button size="icon" variant="ghost" className="h-10 w-10 text-white hover:bg-white/10" onClick={reset} aria-label="Reset"><RotateCcw className="h-5 w-5" /></Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
