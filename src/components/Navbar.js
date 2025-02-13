"use client"
import Link from 'next/link';
import Image from 'next/image';
import { useState, useRef } from 'react';
import { user_logout } from '@/utils/data_fetch';
import { PersonCircle } from './SVGs';

const Navbar = ({user_data}) => {
    const [show_user_options, set_show_user_options] = useState(false);

    const handle_logout = () => {
        user_logout();
        window.location.href = '/login';
    }
    return (
        <>
            {/* NAVBAR */}
            < div className='fixed z-50 top-0 bg-white shadow-[#e31635] shadow flex items-center gap-10 w-full justify-between px-16 py-2' >
                <div className=' text-primary w-full text-xl font-bold flex justify-start items-center gap-3'>
                    <Image src={'/logo.svg'} width={150} height={20} alt="LOGO" />
                </div>

                <div className=' flex gap-8'>
                    <div className=' text-xl font-medium flex items-center gap-2 '>
                        <span>Credits:</span>
                        <span>{user_data.tokens ? user_data.tokens : "🚫"}</span>
                    </div>

                    <div onClick={() => { set_show_user_options(!show_user_options) }} className=''>

                        {user_data.avatar_url ?
                            <Image src={user_data.avatar_url} height={40} width={40} alt="user_avatar" className=" cursor-pointer min-w-10 min-h-10 rounded-full" />
                            :
                            <PersonCircle className=" cursor-pointer size-10" strokeWidth={1} />
                        }

                        {/* logout, profile buttons popup */}
                        <div className={`absolute z-30 group-hover:opacity-100 ${show_user_options ? "max-h-60" : "max-h-0"} overflow-hidden top-12 right-10  w-40 rounded bg-stone-100 text-gray-600 shadow transition-all`}>
                            <div className=' flex flex-col divide-gray-300 w-full px-2 py-3 text-lg '>
                                {
                                    user_data.verifier 
                                    &&
                                    <Link href={"/media-analyzer"} className='px-2 py-1 hover:bg-stone-200 transition-all '>
                                        Direct Checker
                                    </Link>
                                }
                                <Link href={"/fact-checker"} className='px-2 py-1 hover:bg-stone-200 transition-all '>
                                    Fact Checker
                                </Link>
                                <Link href={"/user/case-list"} className='px-2 py-1 hover:bg-stone-200 transition-all '>
                                    {user_data.verifier ? "Verify Cases" :"Case List"}
                                </Link>
                                {/* <Link href={"/user/profile"} className='px-2 py-1 hover:bg-stone-200 transition-all '>
                                    Profile
                                </Link> */}
                                <div onClick={handle_logout} className='px-2 py-1 cursor-pointer hover:bg-stone-200 transition-all '>
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