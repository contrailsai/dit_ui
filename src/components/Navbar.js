"use client"
import Link from 'next/link';
import Image from 'next/image';
import { useState, useRef } from 'react';
import { user_logout } from '@/utils/data_fetch';

const Navbar = ({user_data}) => {
    const [show_user_options, set_show_user_options] = useState(false);

    const handle_logout = () => {
        user_logout();
        window.location.href = '/login';
    }
    return (
        <>
            {/* NAVBAR */}
            < div className='fixed z-50 top-0 bg-white  shadow flex items-center gap-10 w-full justify-between px-16 py-2' >
                <div className=' text-primary w-full text-xl font-bold flex justify-start items-center gap-3'>
                    <Image src={'/logo.svg'} width={30} height={20} alt="LOGO" />
                    Contrails AI
                </div>

                <div className=' flex gap-8'>
                    <div className=' text-xl font-medium flex items-center gap-2 '>
                        {/* <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="CurrentColor" className="size-10">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
                        </svg> */}
                        <span>Credits:</span>
                        <span>{user_data.tokens ? user_data.tokens : "🚫"}</span>
                    </div>

                    <div onClick={() => { set_show_user_options(!show_user_options) }} className=''>

                        {user_data.avatar_url ?
                            <Image src={user_data.avatar_url} height={40} width={40} alt="user_avatar" className=" cursor-pointer min-w-10 min-h-10 rounded-full" />
                            :
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="CurrentColor" className=" cursor-pointer size-10">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                            </svg>
                        }

                        {/* logout, profile buttons popup */}
                        <div className={`absolute z-30 group-hover:opacity-100 ${show_user_options ? "max-h-60" : "max-h-0"} overflow-hidden top-12 right-10  w-40 rounded bg-slate-100 text-gray-600 shadow transition-all`}>
                            <div className=' flex flex-col divide-gray-300 w-full px-2 py-3 text-lg '>
                                {
                                    user_data.verifier 
                                    &&
                                    <Link href={"/media-analyzer"} className='px-2 py-1 hover:bg-slate-200 transition-all '>
                                        Direct Checker
                                    </Link>
                                }
                                <Link href={"/fact-checker"} className='px-2 py-1 hover:bg-slate-200 transition-all '>
                                    Fact Checker
                                </Link>
                                <Link href={"/user/case-list"} className='px-2 py-1 hover:bg-slate-200 transition-all '>
                                    {user_data.verifier ? "Verify Cases" :"Case List"}
                                </Link>
                                {/* <Link href={"/user/profile"} className='px-2 py-1 hover:bg-slate-200 transition-all '>
                                    Profile
                                </Link> */}
                                <div onClick={handle_logout} className='px-2 py-1 cursor-pointer hover:bg-slate-200 transition-all '>
                                    Logout
                                </div>
                            </div>
                        </div>

                        <div onClick={() => { set_show_user_options(!show_user_options) }} className={` ${show_user_options ? "" : "hidden"} absolute top-0 left-0 h-screen w-screen `} />
                    </div>
                </div>
            </div >

        </>
    )
}

export default Navbar;