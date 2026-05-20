"use client";

interface Props {
  slug: string;
  filename: string;
}

export function DownloadImageButton({ slug, filename }: Props) {
  async function onClick() {
    try {
      const res = await fetch(`/api/og/match/${slug}`);
      if (!res.ok) throw new Error("Image fetch failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Could not generate image. Try again in a moment.");
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg bg-pitch-600 px-3 py-2 text-sm font-medium text-white hover:bg-pitch-700"
    >
      Download Image
    </button>
  );
}
