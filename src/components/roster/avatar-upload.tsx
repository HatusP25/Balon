"use client";

import { useCallback, useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Button } from "@/components/ui/button";

interface Props {
  /** Existing avatar URL to show, if any */
  existingUrl?: string | null;
  /** Hidden input name to submit the cropped image (as base64 data URL) */
  name: string;
}

export function AvatarUpload({ existingUrl, name }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [croppedDataUrl, setCroppedDataUrl] = useState<string | null>(null);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setSrc(String(reader.result));
    reader.readAsDataURL(file);
  }

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  async function confirmCrop() {
    if (!src || !croppedAreaPixels) return;
    const img = new Image();
    img.src = src;
    await new Promise((r) => (img.onload = r));

    const canvas = document.createElement("canvas");
    canvas.width = croppedAreaPixels.width;
    canvas.height = croppedAreaPixels.height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(
      img,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
    );
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setCroppedDataUrl(dataUrl);
    setSrc(null);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <div className="h-20 w-20 overflow-hidden rounded-full bg-pitch-100">
          {croppedDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={croppedDataUrl} alt="" className="h-full w-full object-cover" />
          ) : existingUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={existingUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-pitch-700">
              No photo
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFile}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
        >
          {croppedDataUrl || existingUrl ? "Change photo" : "Upload photo"}
        </Button>
      </div>

      <input type="hidden" name={name} value={croppedDataUrl ?? ""} />

      {src && (
        <div className="rounded-lg border bg-white p-4">
          <div className="relative h-64 w-full bg-black/80">
            <Cropper
              image={src}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setSrc(null)}>
              Cancel
            </Button>
            <Button type="button" onClick={confirmCrop} className="bg-pitch-600 hover:bg-pitch-700">
              Use this crop
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
