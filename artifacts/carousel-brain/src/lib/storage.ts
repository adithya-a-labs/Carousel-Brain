type ApiEnvelope<T> = {
  data: T;
};

type SignedStorageUrl = {
  path: string;
  url: string;
};

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/+$/, "");

function apiPath(path: string) {
  return `${API_BASE_URL}/api${path}`;
}

export async function getSignedStorageUrls(paths: string[]): Promise<Record<string, string>> {
  const uniquePaths = Array.from(new Set(paths.filter(Boolean)));

  if (uniquePaths.length === 0) {
    return {};
  }

  const response = await fetch(apiPath("/storage/signed-urls"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ paths: uniquePaths }),
  });

  if (!response.ok) {
    return {};
  }

  const payload = (await response.json()) as ApiEnvelope<SignedStorageUrl[]>;
  return Object.fromEntries(payload.data.map((item) => [item.path, item.url]));
}
