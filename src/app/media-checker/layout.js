import { redirect } from "next/navigation";
import { get_user_data } from "@/utils/user_functions";
import Sidebar from "@/components/Sidebar";
import UserProvider from "@/context/UserContext";

export const metadata = {
    title: "DIT | Fact Checker",
    description: "tool for media checking"
};

export default async function FactCheckerLayout({ children }) {
    const user = await get_user_data();

    if (!user) {
        return redirect("/login?message=You must be logged in to access the fact checker");
    }

    return (
        <>
            <Sidebar user={user} />
            <UserProvider initialUser={user}>
                {/* Updated padding to match new sidebar width and added minimal background */}
                <main className="pl-64 min-h-screen bg-gray-50/50">
                    <div className=" px-2 py-6 max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </UserProvider>
        </>
    );
}