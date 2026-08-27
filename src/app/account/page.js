import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import AccountClient from "./AccountClient";
import { listApiKeys } from "./actions";
import { get_user_data } from "@/utils/user_functions";

export const metadata = {
  title: "DIT | API Keys",
  description: "Manage Contrails API keys",
};

export default async function AccountPage() {
  const user = await get_user_data();
  if (!user) {
    return redirect("/login?message=You must be logged in");
  }
  if (!user.verifier) {
    return redirect("/media-checker");
  }

  let keys = [];
  let loadError = null;
  try {
    keys = await listApiKeys();
  } catch (e) {
    loadError = e.message || "Failed to load keys";
  }

  return (
    <AppShell
      title="API Keys"
      description="Create and revoke keys for the Contrails detect API"
      requireVerifier
    >
      {loadError ? (
        <div className="mx-8 mt-6 rounded-2xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
          {loadError}
        </div>
      ) : (
        <AccountClient initialKeys={keys} />
      )}
    </AppShell>
  );
}
