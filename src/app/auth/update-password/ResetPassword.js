'use client'
import Image from "next/image";
import { password_update } from "@/utils/user_functions"
import { useState } from "react";

const ResetPasswordBlock = ({user, eventInfo }) => {

    const email = user.email;
    const [password, setPassword] = useState('');

    const [show_message, set_show_message] = useState(eventInfo?.message);

    const [loading, setloading] = useState(false);

    const handle_password_update = async (e) => {
        e.preventDefault();
        setloading(true);
        
        try {
            await update_password();
        }
        catch (error) {
            console.log(error);
            window.location.href = "/login?message=Could not update user";
        }
        finally{
            setloading(false);
            window.location.href = "/";
        }
    }

    return (
        <>
            <div className=' shadow-md shadow-primary bg-white mt-10 flex flex-col items-stretch w-fit py-10 px-10 rounded-xl text-gray-800 '>

                {/* LOGO */}
                <div className=' text-primary w-full text-xl font-bold pb-7 flex justify-start items-center gap-3'>
                    <Image src={'/logo.svg'} width={30} height={20} alt="LOGO" />
                    Contrails AI
                </div>

                <div className=" text-3xl font-semibold">
                    Reset Password
                </div>
                <div className=' font-light mb-2'>
                    enter email and updated password
                </div>

                {/* FORM */}
                <form onSubmit={handle_password_update} className=' flex flex-col gap-2'>
                    <label className=' flex gap-1 h-0 relative z-10 font-medium text-xs top-3 left-2 ' htmlFor="password">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="size-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                        </svg>
                        Email
                    </label>
                    <input
                        name='email'
                        type="email"
                        required
                        value={email}
                        className='border-2 bg-gray-50 focus:bg-white outline-none pt-5 pb-1 px-2 min-w-96 rounded-lg'
                        disabled
                    />
                    <label className=' flex gap-1 h-0 relative z-10 font-medium text-xs top-3 left-2 ' htmlFor="password">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="size-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                        </svg>
                        New Password
                    </label>
                    <input
                        name='password'
                        type="password"
                        required
                        minLength={8}
                        value={password}
                        className='border-2 bg-gray-50 focus:bg-white outline-none pt-5 pb-1 px-2 min-w-96 rounded-lg'
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    <button type="submit" className=' mt-3 outline-none flex gap-3 items-center justify-center p-3 font-medium bg-primary hover:bg-primary/90 text-white rounded-lg transition-all'>
                        <div>
                            Submit
                        </div>
                        {
                            loading &&
                            <div role="status">
                                <svg aria-hidden="true" className="w-6 h-6 text-sky-300 animate-spin fill-sky-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                                    <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
                                </svg>
                            </div>
                        }
                    </button>

                </form>

            </div >

        </>
    )
}

export default ResetPasswordBlock;