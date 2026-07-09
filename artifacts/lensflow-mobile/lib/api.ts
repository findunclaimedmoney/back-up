import { fetch as expoFetch } from "expo/fetch";

import { getStoredItem } from "@/lib/storage";

const AUTH_TOKEN_KEY = "auth_session_token";

export function getApiBaseUrl(): string {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  return domain ? `https://${domain}` : "";
}

async function authHeaders(extra?: Record<string, string>): Promise<Record<string, string>> {
  const token = await getStoredItem(AUTH_TOKEN_KEY);
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(extra ?? {}),
  };
}

export async function createMiaConversation(): Promise<number> {
  const res = await fetch(`${getApiBaseUrl()}/api/anthropic/conversations`, {
    method: "POST",
    headers: await authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ title: "Mia Mobile Chat" }),
  });
  if (!res.ok) throw new Error("Failed to start conversation");
  const data = (await res.json()) as { id: number };
  return data.id;
}

export async function streamMiaMessage(
  conversationId: number,
  content: string,
  onChunk: (text: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  const res = await expoFetch(
    `${getApiBaseUrl()}/api/anthropic/conversations/${conversationId}/messages`,
    {
      method: "POST",
      headers: await authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ content }),
      signal,
    },
  );
  if (!res.ok || !res.body) throw new Error("Stream failed");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      try {
        const payload = JSON.parse(line.slice(6)) as {
          content?: string;
          done?: boolean;
          error?: string;
        };
        if (payload.content) onChunk(payload.content);
        if (payload.done || payload.error) return;
      } catch {
        /* ignore malformed chunk */
      }
    }
  }
}

export interface PickedPhoto {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
}

export async function uploadPhoto(asset: PickedPhoto): Promise<string> {
  const name = asset.fileName ?? `photo-${Date.now()}.jpg`;
  const contentType = asset.mimeType ?? "image/jpeg";

  const fileResp = await fetch(asset.uri);
  const blob = await fileResp.blob();
  const size = asset.fileSize ?? blob.size;

  const urlRes = await fetch(`${getApiBaseUrl()}/api/storage/uploads/request-url`, {
    method: "POST",
    headers: await authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ name, size, contentType }),
  });
  if (!urlRes.ok) throw new Error("Could not get upload URL");
  const { uploadURL, publicUrl } = (await urlRes.json()) as {
    uploadURL: string;
    publicUrl: string;
  };

  const putRes = await fetch(uploadURL, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: blob,
  });
  if (!putRes.ok) throw new Error("Upload failed");

  return publicUrl;
}

export interface RecordedVideo {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
}

// Uploads a self-recorded video to object storage and returns its public URL.
// Reuses the same presigned-URL flow as photo uploads.
export async function uploadVideo(asset: RecordedVideo): Promise<string> {
  const name = asset.fileName ?? `recording-${Date.now()}.mp4`;
  const contentType = asset.mimeType ?? "video/mp4";

  const fileResp = await fetch(asset.uri);
  const blob = await fileResp.blob();
  const size = asset.fileSize ?? blob.size;

  const urlRes = await fetch(`${getApiBaseUrl()}/api/storage/uploads/request-url`, {
    method: "POST",
    headers: await authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ name, size, contentType }),
  });
  if (!urlRes.ok) throw new Error("Could not get upload URL");
  const { uploadURL, publicUrl } = (await urlRes.json()) as {
    uploadURL: string;
    publicUrl: string;
  };

  const putRes = await fetch(uploadURL, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: blob,
  });
  if (!putRes.ok) throw new Error("Video upload failed");

  return publicUrl;
}
