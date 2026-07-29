const ACCOUNT_API_URL = "";

function authHeaders(): Record<string, string> {
  const token = sessionStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface Account {
  id: string;
  username: string;
  email?: string;
  phone?: string;
  about?: string;
}

async function parseJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function fetchAccounts(): Promise<Account[]> {
  const response = await fetch(ACCOUNT_API_URL, {
    method: "GET",
    headers: { "Content-Type": "application/json", ...authHeaders() },
  });

  const data = await parseJson(response);

  if (!response.ok) {
    const message =
      (data as { message?: string } | null)?.message ||
      "Could not load accounts.";
    throw new Error(message);
  }

  if (Array.isArray(data)) return data as Account[];
  if (data && Array.isArray((data as { accounts?: unknown }).accounts)) {
    return (data as { accounts: Account[] }).accounts;
  }
  return [];
}
