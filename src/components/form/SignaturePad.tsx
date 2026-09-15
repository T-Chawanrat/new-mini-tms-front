import { useRef, type PointerEvent } from "react";

export default function SignaturePad({ onChange }: { onChange: (signature: string | null) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  const pointFromEvent = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * (canvas.width / rect.width), y: (event.clientY - rect.top) * (canvas.height / rect.height) };
  };
  const startDrawing = (event: PointerEvent<HTMLCanvasElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    drawingRef.current = true;
    lastPointRef.current = pointFromEvent(event);
  };
  const draw = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || !lastPointRef.current) return;
    const canvas = canvasRef.current!;
    const context = canvas.getContext("2d");
    if (!context) return;
    const point = pointFromEvent(event);
    context.beginPath();
    context.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    context.lineTo(point.x, point.y);
    context.strokeStyle = "#0f172a";
    context.lineWidth = 5;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.stroke();
    lastPointRef.current = point;
  };
  const finishDrawing = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    lastPointRef.current = null;
    onChange(canvasRef.current?.toDataURL("image/png") || null);
  };
  const clear = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (canvas && context) context.clearRect(0, 0, canvas.width, canvas.height);
    onChange(null);
  };

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm font-semibold text-slate-700">
        <span>ลายเซ็นผู้รับ<span className="ml-1 text-red-500">*</span></span>
        <button type="button" onClick={clear} className="text-xs font-semibold text-rose-600 hover:text-rose-700">ล้างลายเซ็น</button>
      </div>
      <canvas ref={canvasRef} width={800} height={260} onPointerDown={startDrawing} onPointerMove={draw} onPointerUp={finishDrawing} onPointerLeave={finishDrawing} className="h-32 w-full touch-none rounded-lg border-2 border-dashed border-slate-300 bg-white" />
      <p className="mt-1.5 text-xs text-slate-400">ใช้เมาส์หรือนิ้วลากเพื่อเซ็นชื่อ</p>
    </div>
  );
}
