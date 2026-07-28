"use client"
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { user_logout } from '@/utils/user_functions';
import { LucideChartArea, List, LogOut } from "lucide-react";

const Sidebar = ({ user }) => {
    const pathname = usePathname();

    const handle_logout = async () => {
        await user_logout();
        window.location.href = '/login';
    }

    const navItems = [
        {
            href: "/media-checker",
            label: "Media Checker",
            icon: LucideChartArea,
            match: (path) => path === "/media-checker" || path === "/media-analyzer",
        },
        {
            href: "/media-checker/case-list",
            label: user?.verifier ? "Verify Cases" : "Case List",
            icon: List,
            match: (path) => path?.startsWith("/media-checker/case-list") || path?.startsWith("/view/"),
        },
    ];

    return (
        <div className="fixed h-screen w-40 bg-white py-5 border-r border-slate-200 shadow-sm z-20">
            <div className="text-primary w-full text-lg font-bold flex justify-start items-center gap-2 pl-2.5 pr-2">
                <Image src="/logo.png" width={27} height={20} alt="LOGO" />
                <span className="leading-tight">Contrails AI</span>
            </div>

            <nav className="flex flex-col gap-1.5 w-full py-10 px-1.5">
                {navItems.map(({ href, label, icon: Icon, match }) => {
                    const active = match(pathname);
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={`w-full pl-2.5 pr-2 py-2.5 rounded-full flex items-center gap-1.5 text-sm transition-all duration-200 ${
                                active
                                    ? "bg-primary text-white shadow-sm"
                                    : "text-slate-600 hover:bg-slate-100"
                            }`}
                        >
                            <Icon className="size-5 shrink-0" strokeWidth={active ? 2 : 1.75} />
                            <span className="leading-snug">{label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="absolute bottom-0 w-full py-8 px-2">
                <div className="flex flex-col items-center px-2 py-4">
                    <div className="flex gap-1.5 items-baseline">
                        <span className="font-medium text-slate-400 text-sm">Credits</span>
                        <span className="font-bold text-xl text-primary tabular-nums">
                            {user?.tokens !== undefined && user?.tokens !== null ? user.tokens : "0"}
                        </span>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={handle_logout}
                    className="w-full pl-3 pr-3 py-2 rounded-full text-sm text-slate-600 border border-transparent hover:border-red-100 hover:bg-red-50 hover:text-red-600 transition-all cursor-pointer flex items-center gap-1.5 justify-center"
                >
                    <LogOut className="size-4" strokeWidth={1.75} />
                    Log out
                </button>
            </div>
        </div>
    )
}

export default Sidebar;
