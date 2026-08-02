export const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export const today = () => new Date().toISOString().slice(0, 10);

export const fmt = (n: number) => (+n).toLocaleString();

export const money = (n: number) =>
  "$" +
  (+n).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const esc = (s: unknown) =>
  String(s == null ? "" : s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string
  );

export function downloadFile(name: string, data: string, type: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([data], { type }));
  a.download = name;
  a.click();
}

export async function sha(text: string): Promise<string> {
  if (crypto?.subtle) {
    const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
  }
  // Fallback for non-secure contexts (e.g. some file:// setups)
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return "fnv-" + (h >>> 0).toString(16);
}

export function downscale(file: File, maxDim: number, q: number): Promise<string> {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => {
      const img = new Image();
      img.onload = () => {
        const w = img.width,
          h = img.height;
        const s = Math.min(1, maxDim / Math.max(w, h));
        const c = document.createElement("canvas");
        c.width = Math.round(w * s);
        c.height = Math.round(h * s);
        c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
        res(c.toDataURL("image/jpeg", q));
      };
      img.onerror = rej;
      img.src = fr.result as string;
    };
    fr.onerror = rej;
    fr.readAsDataURL(file);
  });
}
