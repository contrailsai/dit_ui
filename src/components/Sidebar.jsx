"use client"
import Link from 'next/link';
import Image from 'next/image';
import { user_logout } from '@/utils/user_functions';
import { BriefcaseBusiness, LucideChartArea, List} from "lucide-react";

const Sidebar = ({ user }) => {

    const handle_logout = async () => {
        await user_logout();
        window.location.href = '/login';
    }

    return (
        <div className="fixed h-screen w-40 bg-white py-5 shadow-inner shadow-primary">

            <div className=' text-primary w-full text-xl font-bold flex justify-start items-center gap-2 pl-1.5 pr-1.5 '>
                <Image src={'/logo.png'} width={27} height={20} alt="LOGO" />
                Contrails AI
            </div>


            <div className=' flex flex-col gap-2 divide-gray-300 w-full py-10  '>
                {/* {
                    user.verifier
                    &&
                    <Link href={"/demo"} className='  w-fit pl-2 pr-4 py-1 rounded-e-full shadow shadow-white/0 hover:shadow-primary transition-all flex items-center gap-1 '>
                        <BriefcaseBusiness className="size-5" />
                        <span>
                            Demo
                        </span>
                    </Link>
                } */}
                <Link href={"/media-checker"} className='w-fit pl-2 pr-2 py-1 rounded-e-full shadow shadow-white/0 hover:shadow-primary transition-all flex items-center gap-1 '>
                    <LucideChartArea className="size-6" />
                    <span>
                        Media Checker
                    </span>
                </Link>
                <Link href={"/media-checker/case-list"} className='w-fit pl-2 pr-4 py-1 rounded-e-full shadow shadow-white/0 hover:shadow-primary transition-all flex items-center gap-1 '>
                    <List className="size-6" />
                    <span>
                        {user.verifier ? "Verify Cases" : "Case List"}
                    </span>
                </Link>

            </div>

            <div className='absolute bottom-0 w-full py-10'>
                <div className=' text-2xl font-medium flex flex-col items-center px-2 py-5 text-primary '>
                    {/* CREDITS */}
                    {/* <Banknote className="size-16 stroke-white stroke-1 fill-primary" /> */}
                    <div className='flex gap-2'>
                        <span className='font-light'>Credits:</span>
                        <span className='font-bold'>{user.tokens ? user.tokens : "🚫"}</span>
                    </div>
                </div>

                {/* LOGOUT */}
                <div onClick={handle_logout} className=' w-fit pl-8 pr-6 py-1 rounded-e-full shadow shadow-white/0 hover:shadow-red-500  hover:bg-red-50 transition-all cursor-pointer flex items-center gap-1 '>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                        <path fillRule="evenodd" d="M16.5 3.75a1.5 1.5 0 0 1 1.5 1.5v13.5a1.5 1.5 0 0 1-1.5 1.5h-6a1.5 1.5 0 0 1-1.5-1.5V15a.75.75 0 0 0-1.5 0v3.75a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V5.25a3 3 0 0 0-3-3h-6a3 3 0 0 0-3 3V9A.75.75 0 1 0 9 9V5.25a1.5 1.5 0 0 1 1.5-1.5h6ZM5.78 8.47a.75.75 0 0 0-1.06 0l-3 3a.75.75 0 0 0 0 1.06l3 3a.75.75 0 0 0 1.06-1.06l-1.72-1.72H15a.75.75 0 0 0 0-1.5H4.06l1.72-1.72a.75.75 0 0 0 0-1.06Z" clipRule="evenodd" />
                    </svg>

                    Log out
                </div>
            </div>
        </div>
    )
}

export default Sidebar;