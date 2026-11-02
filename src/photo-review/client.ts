import {
  readConfig,
  assignmentDigest,
  readSession,
  readStatus,
  type ReviewAssignment,
  type ReviewConfig,
  type ReviewSession,
} from "./contracts";
export const MAX_INPUT_BYTES = 15 * 1024 * 1024;
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
export async function preparePhoto(file: File): Promise<Blob> {
  if (
    !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
    file.size > MAX_INPUT_BYTES ||
    !file.size
  )
    throw new Error(
      "Vyber fotku JPG, PNG nebo WebP do 15 MB. HEIC nejprve převeď na JPG.",
    );
  const bitmap = await createImageBitmap(file);
  try {
    if (
      bitmap.width * bitmap.height > 40_000_000 ||
      !bitmap.width ||
      !bitmap.height
    )
      throw new Error("Fotka má příliš velké rozměry. Vyber menší obrázek.");
    const scale = Math.min(1, 2200 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Prohlížeč nedokáže fotku připravit.");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (b) =>
          b ? resolve(b) : reject(new Error("Fotku se nepodařilo připravit.")),
        "image/jpeg",
        0.88,
      ),
    );
    if (blob.size > MAX_UPLOAD_BYTES)
      throw new Error(
        "Fotka je i po zmenšení příliš velká. Vyfoť jen pracovní list.",
      );
    return blob; // Canvas encoding removes source EXIF; only this re-encoded image is uploaded.
  } finally {
    bitmap.close();
  }
}
export class ReviewApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ReviewApiError";
  }
}
export type Fetcher = typeof fetch;
export function reviewClient(config: ReviewConfig, request: Fetcher = fetch) {
  config = readConfig(config);
  if (!config.enabled) throw new Error("Kontrola fotek ještě není zapnutá.");
  const call = async (
    path: string,
    options: RequestInit = {},
    uploadToken?: string,
    ownerToken?: string,
  ) => {
    const controller = new AbortController();
    const timer = setTimeout(
      () => controller.abort(),
      options.method === "PUT" ? 180000 : 20000,
    );
    try {
      const response = await request(config.apiBaseUrl + path, {
        ...options,
        redirect: "error",
        credentials: "omit",
        referrerPolicy: "no-referrer",
        signal: controller.signal,
        headers: {
          ...options.headers,
          ...(uploadToken
            ? { "X-Upload-Token": uploadToken }
            : ownerToken
              ? { Authorization: `Review ${ownerToken}` }
              : {}),
        },
      });
      if (!response.ok) {
        const messages: Record<number, string> = {
          401: "Platnost odkazu vypršela. Vytvoř nový QR kód.",
          403: "K této kontrole nemáš přístup.",
          409: "Kontrola už běží nebo je hotová. Vyčkej na výsledek.",
          410: "Platnost kontroly skončila. Vytvoř novou kontrolu.",
          413: "Fotka je příliš velká.",
          429: "Dnes už proběhlo příliš mnoho kontrol. Zkus to později.",
          503: "Kontrolní služba teď není dostupná. Zkus to později.",
        };
        throw new ReviewApiError(
          response.status,
          messages[response.status] ||
            "Kontrola se nepodařila. Zkus ověřit stav, než odešleš fotku znovu.",
        );
      }
      return response.status === 204 ? null : await response.json();
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError")
        throw new Error(
          "Čekání trvá příliš dlouho. Kontrola může stále běžet; nejprve ověř její stav.",
        );
      if (e instanceof TypeError)
        throw new Error(
          "Spojení se službou se nepodařilo. Ověř připojení a stav kontroly.",
        );
      throw e;
    } finally {
      clearTimeout(timer);
    }
  };
  return {
    async create(a: ReviewAssignment, requestId = a.id) {
      const digest = await assignmentDigest(a);
      return readSession(
        await call("/v1/reviews", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": requestId,
          },
          body: JSON.stringify({ assignment: a, assignmentDigest: digest }),
        }),
        a,
        digest,
      );
    },
    async status(a: ReviewAssignment, s: ReviewSession) {
      return readStatus(
        await call(
          `/v1/reviews/${encodeURIComponent(s.id)}`,
          {},
          undefined,
          s.ownerToken,
        ),
        a,
        s,
      );
    },
    async upload(id: string, token: string, photo: Blob) {
      if (
        photo.type !== "image/jpeg" ||
        !photo.size ||
        photo.size > MAX_UPLOAD_BYTES
      )
        throw new Error("Fotka není připravená pro odeslání.");
      await call(
        `/v1/reviews/${encodeURIComponent(id)}/photo`,
        {
          method: "PUT",
          headers: { "Content-Type": "image/jpeg", "Idempotency-Key": id },
          body: photo,
        },
        token,
      );
    },
  };
}
