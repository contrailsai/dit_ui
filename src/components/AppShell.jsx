import { redirect } from "next/navigation";
import { get_user_data } from "@/utils/user_functions";
import Sidebar from "@/components/Sidebar";
import UserProvider from "@/context/UserContext";

export default async function AppShell({
  children,
  title,
  description,
  requireVerifier = false,
}) {
  const user = await get_user_data();

  if (!user) {
    return redirect("/login?message=You must be logged in");
  }

  if (requireVerifier && !user.verifier) {
    return redirect("/media-checker");
  }

  return (
    <>
      <Sidebar user={user} />
      <UserProvider initialUser={user}>
        <div className="pl-40 min-h-screen bg-slate-50">
          {(title || description) && (
            <div className="px-8 pt-10 pb-2">
              {title && (
                <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{title}</h1>
              )}
              {description && (
                <p className="text-sm text-slate-500 mt-1.5">{description}</p>
              )}
            </div>
          )}
          {children}
        </div>
      </UserProvider>
    </>
  );
}
