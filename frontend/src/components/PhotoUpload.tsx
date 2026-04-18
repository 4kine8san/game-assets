import { useRef } from "react";
import type { PhotoItem } from "./photoUtils";

interface Props {
  photos: PhotoItem[];
  onChange: (photos: PhotoItem[]) => void;
}

export default function PhotoUpload({ photos, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const next: PhotoItem[] = Array.from(files).map((f) => ({
      id: crypto.randomUUID(),
      file: f,
      previewUrl: URL.createObjectURL(f),
      rotation: 0,
    }));
    onChange([...photos, ...next]);
  };

  const remove = (id: string) => {
    const item = photos.find((p) => p.id === id);
    if (item) URL.revokeObjectURL(item.previewUrl);
    onChange(photos.filter((p) => p.id !== id));
  };

  const rotate = (id: string, delta: number) => {
    onChange(photos.map((p) =>
      p.id === id ? { ...p, rotation: ((p.rotation + delta) % 360 + 360) % 360 } : p
    ));
  };

  const move = (idx: number, dir: -1 | 1) => {
    const next = [...photos];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    onChange(next);
  };

  return (
    <div>
      <div
        className="border-2 border-dashed border-slate-400 rounded-xl p-7 flex flex-col items-center gap-1.5 cursor-pointer bg-slate-50"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
      >
        <span className="text-4xl">📷</span>
        <span className="text-[15px] font-semibold text-slate-700">クリックまたはドラッグ＆ドロップで写真を追加</span>
        <span className="text-[13px] text-slate-400">複数選択可 ／ 1枚目がサムネイルになります</span>
        <input
          ref={inputRef} type="file" accept="image/*" multiple
          className="hidden"
          onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }}
        />
      </div>

      {photos.length > 0 && (
        <div className="mt-3.5 flex flex-col gap-2.5">
          {photos.map((item, idx) => (
            <div key={item.id} className="flex items-center gap-2.5 bg-white border border-slate-200 rounded-lg py-2.5 px-3.5">
              <div className="w-[72px] text-center shrink-0">
                {idx === 0
                  ? <span className="bg-blue-600 text-white text-[11px] font-bold py-0.5 px-2 rounded-full">サムネイル</span>
                  : <span className="text-sm text-slate-500 font-semibold">{idx + 1}</span>}
              </div>

              <div className="w-[70px] h-[70px] overflow-hidden rounded-md shrink-0 flex items-center justify-center bg-slate-100">
                <img
                  src={item.previewUrl}
                  alt={item.file.name}
                  className="w-[70px] h-[70px] object-cover transition-transform duration-200"
                  style={{ transform: `rotate(${item.rotation}deg)` }}
                />
              </div>

              <span className="flex-1 text-sm text-slate-600 overflow-hidden text-ellipsis whitespace-nowrap">{item.file.name}</span>
              {item.rotation !== 0 && (
                <span className="text-xs text-blue-600 font-bold bg-blue-50 py-0.5 px-2 rounded-full shrink-0">{item.rotation}°</span>
              )}

              <div className="flex gap-1.5 shrink-0">
                <button type="button" className="w-[34px] h-[34px] border border-blue-200 rounded-md bg-blue-50 cursor-pointer text-base text-blue-600 font-bold" onClick={() => rotate(item.id, -90)} title="左90°回転">↺</button>
                <button type="button" className="w-[34px] h-[34px] border border-blue-200 rounded-md bg-blue-50 cursor-pointer text-base text-blue-600 font-bold" onClick={() => rotate(item.id, 90)} title="右90°回転">↻</button>
                <button type="button" className="w-[34px] h-[34px] border border-slate-200 rounded-md bg-slate-50 cursor-pointer text-[13px] text-slate-600 disabled:opacity-40" onClick={() => move(idx, -1)} disabled={idx === 0} title="上へ">▲</button>
                <button type="button" className="w-[34px] h-[34px] border border-slate-200 rounded-md bg-slate-50 cursor-pointer text-[13px] text-slate-600 disabled:opacity-40" onClick={() => move(idx, 1)} disabled={idx === photos.length - 1} title="下へ">▼</button>
                <button type="button" className="w-[34px] h-[34px] border-none rounded-md bg-red-100 cursor-pointer text-sm text-red-600" onClick={() => remove(item.id)} title="削除">✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
