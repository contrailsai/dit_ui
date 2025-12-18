"use client"
import Link from 'next/link';
import Image from 'next/image';
import { user_logout } from '@/utils/user_functions';
import { BriefcaseBusiness, LucideChartArea, List, LogOut, Sparkles } from "lucide-react";

const Sidebar = ({ user }) => {

    const handle_logout = async () => {
        await user_logout();
        window.location.href = '/login';
    }

    return (
        // Changed to w-64, added border-r instead of inner shadow, flex-col layout
        <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-100 flex flex-col justify-between px-4 py-6 z-50">

            {/* --- TOP SECTION --- */}
            <div>
                {/* Logo Area */}
                <div className='flex items-center gap-3 px-2 mb-10'>
                    <div className="relative h-8 w-8">
                        {/* Ensure your logo fits well here */}
                        <Image
                            src={'/logo.png'}
                            fill
                            className="object-contain"
                            alt="LOGO"
                        />
                    </div>
                    <span className="text-3xl font-bold tracking-tight text-primary">
                        Contrails AI
                    </span>
                </div>

                {/* Navigation Links */}
                <nav className='flex flex-col gap-1.5 w-full'>
                    {/* Kept logic for demo link if you uncomment it later */}
                    {/* { user.verifier && ... } */}

                    <Link
                        href={"/media-checker"}
                        className='group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition-all duration-200'
                    >
                        <LucideChartArea className="size-5 text-zinc-400 group-hover:text-primary transition-colors" />
                        <span>Media Checker</span>
                    </Link>

                    <Link
                        href={"/media-checker/case-list"}
                        className='group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition-all duration-200'
                    >
                        <List className="size-5 text-zinc-400 group-hover:text-primary transition-colors" />
                        <span>{user.verifier ? "Verify Cases" : "Case List"}</span>
                    </Link>
                </nav>
            </div>

            {/* --- BOTTOM SECTION --- */}
            <div className='flex flex-col gap-4'>

                {/* Credits Card */}
                <div className='bg-zinc-50 flex items-end justify-between rounded-xl p-4 border border-zinc-100'>
                    <div className='flex items-center gap-2 mb-1 text-xs font-semibold text-zinc-400 uppercase tracking-wider'>
                        <Sparkles className="size-3" />
                        <span>Credits</span>
                    </div>
                    <div className='text-2xl font-bold text-zinc-800'>
                        {user.tokens !== undefined && user.tokens !== null ? user.tokens : "0"}
                    </div>
                </div>

                {/* Divider */}
                <div className="h-px w-full bg-zinc-100 my-1"></div>

                {/* Logout */}
                <button
                    onClick={handle_logout}
                    className='flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-zinc-500 hover:text-red-600 hover:bg-red-50 transition-all duration-200 w-full text-left'
                >
                    <LogOut className="size-5" />
                    <span>Log out</span>
                </button>
            </div>
        </aside>
    )
}

export default Sidebar;