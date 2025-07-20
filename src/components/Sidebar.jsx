"use client"
import Link from 'next/link';
import Image from 'next/image';
import { useState, useRef } from 'react';
import { user_logout } from '@/utils/data_fetch';
import { PersonCircle } from './SVGs';


export const Sidebar = ({ user }) => {

    const handle_logout = () => {
        user_logout();
        window.location.href = '/login';
    }

    return (
        <div className="fixed h-screen w-44 bg-white py-5 shadow-inner shadow-primary">

            {/* <div className=' text-primary w-full text-xl font-bold flex justify-start items-center gap-2 px-[13px] '> */}
            {/* <Image src={'/logo.svg'} width={150} height={20} alt="LOGO" /> */}
            {/* Contrails AI */}
            {/* </div> */}
            {/* LOGO */}
            <div className=' text-primary w-full text-xl font-bold flex flex-col justify-between items-start px-[13px]'>
                <Image src={'/logo.svg'} width={150} height={20} alt="LOGO" className='mb-7' />
                <div className='w-full flex justify-end text-xs font-light'>
                    Powered by
                </div>
                <span className="text-[#2530ff] text-sm font-bold flex flex-row justify-end items-center gap-1 w-full ">
                    <Image src={'/contrails_logo.png'} width={15} height={10} alt="logo 2" />
                    Contrails AI
                </span>
            </div>


            <div className=' flex flex-col gap-2 divide-gray-300 w-full py-10  '>
                {
                    // user.verifier
                    // &&
                    <Link href={"/media-analyzer"} className='  w-fit pl-2 pr-4 py-1 rounded-e-full shadow shadow-white/0 hover:shadow-primary transition-all flex items-center gap-1 '>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                        </svg>

                        <span>
                            DF Checker
                        </span>
                    </Link>
                }
                {/* <Link href={"/fact-checker"} className='w-fit pl-2 pr-4 py-1 rounded-e-full shadow shadow-white/0 hover:shadow-primary transition-all flex items-center gap-1 '>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
                    </svg>
                    <span>
                        Fact Checker
                    </span>
                </Link> */}
                <Link href={"/user/case-list"} className='w-fit pl-2 pr-4 py-1 rounded-e-full shadow shadow-white/0 hover:shadow-primary transition-all flex items-center gap-1 '>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                    </svg>
                    <span>
                        Case List
                        {/* {user.verifier ? "Verify Cases" : "Case List"} */}
                    </span>
                </Link>
            </div>

            <div className='absolute bottom-0 w-full py-10'>
                <div className=' text-2xl font-medium flex flex-col items-center gap-2 px-2 py-5 text-primary '>
                    {/* CREDITS */}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-8">
                        <path d="M12 7.5a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Z" />
                        <path fillRule="evenodd" d="M1.5 4.875C1.5 3.839 2.34 3 3.375 3h17.25c1.035 0 1.875.84 1.875 1.875v9.75c0 1.036-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 0 1 1.5 14.625v-9.75ZM8.25 9.75a3.75 3.75 0 1 1 7.5 0 3.75 3.75 0 0 1-7.5 0ZM18.75 9a.75.75 0 0 0-.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 0 0 .75-.75V9.75a.75.75 0 0 0-.75-.75h-.008ZM4.5 9.75A.75.75 0 0 1 5.25 9h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H5.25a.75.75 0 0 1-.75-.75V9.75Z" clipRule="evenodd" />
                        <path d="M2.25 18a.75.75 0 0 0 0 1.5c5.4 0 10.63.722 15.6 2.075 1.19.324 2.4-.558 2.4-1.82V18.75a.75.75 0 0 0-.75-.75H2.25Z" />
                    </svg>
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