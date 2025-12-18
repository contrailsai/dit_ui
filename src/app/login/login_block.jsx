'use client'
import Image from "next/image";
import { useState, useEffect } from "react";
import { Mail, LockKeyhole, Loader2, XCircle } from "lucide-react"
import { useSearchParams } from 'next/navigation';
import { signIn, signUp, handleGoogleSignIn, forgot_password } from "@/utils/user_functions";

const Google = ({ className }) => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="30" height="30" viewBox="0 0 48 48" className={className} >
            <path fill="#fbc02d" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12	s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20	s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path><path fill="#e53935" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039	l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path><path fill="#4caf50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36	c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path><path fill="#1565c0" d="M43.611,20.083L43.595,20L42,20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571	c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
        </svg>
    )
}

const Login_block = () => {

    // console.log(eventInfo);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [curr_shown, set_curr_shown] = useState('login');   // 'signup', 'login', 'forgot'
    const [show_message, set_show_message] = useState('');

    const [loading, setloading] = useState(false);
    const searchParams = useSearchParams();

    useEffect(() => {
        const message = searchParams.get('message');
        if (message) {
            set_show_message(message);
        }
    }, [searchParams]);

    const handle_pass_signin = async (e) => {
        e.preventDefault();

        setloading(true);

        if (curr_shown === 'signup') {
            //SIGN UP USER
            try {
                await signUp({ email, password });
            }
            catch (error) {
                console.error(error);
            }
        }
        else if (curr_shown === 'login') {
            //LOGIN USER
            try {
                await signIn({ email, password });
            }
            catch (error) {
                console.error(error);
            }
        }
        else if (curr_shown === 'forgot') {
            //FORGOT PASSWORD
            try {
                await forgot_password({ email });
            }
            catch (error) {
                console.error(error);
            }
        }
        setloading(false);
    }

    return (
        <>
            <div className=' shadow-sm shadow-primary border border-primary/30 bg-zinc-50/70 backdrop-blur-sm mt-[7vh] flex flex-col items-stretch w-fit min-w-[33vw] py-10  px-10 rounded-3xl text-zinc-800 '>

                {/* LOGO */}
                <div className=' text-primary w-full text-xl font-bold pb-7 flex justify-start items-center gap-3'>
                    <Image src={'/logo.png'} width={30} height={20} alt="LOGO" />
                    <span className="font-bold text-2xl text-[#2530FF]">
                        Contrails AI
                    </span>
                </div>

                <div className=" text-3xl font-semibold">
                    {curr_shown === 'signup' && 'Create your account'}
                    {curr_shown === 'login' && 'Login to your account'}
                    {curr_shown === 'forgot' && 'Reset your account password'}
                </div>
                <div className=' font-light mt-1 mb-1'>
                    {curr_shown === 'signup' && 'Select method of signup'}
                    {curr_shown === 'login' && 'Enter your email below to login to your account'}
                    {curr_shown === 'forgot' && 'Enter your email below to reset your account password'}
                </div>

                <div className="flex flex-col gap-5 py-3">
                    {/* FORM */}
                    <form onSubmit={handle_pass_signin} className=' flex flex-col gap-2'>
                        <div className="flex flex-col gap-6">
                            <div className="relative">
                                <label className=' pb-1 flex px-1 z-10 font-semibold text-zinc-700 text-sm rounded-full ' htmlFor="email">
                                    {/* <Mail strokeWidth={1} className="size-4" /> */}
                                    Email
                                </label>
                                <input
                                    name='email'
                                    type="email"
                                    required
                                    value={email}
                                    placeholder="name@example.com"
                                    className='border border-zinc-300 bg-white focus:bg-white outline-none py-3 pl-4 pr-2 min-w-96 rounded-2xl w-full'
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            {
                                curr_shown !== 'forgot' &&
                                <div className="relative">
                                    <div className="flex flex-row justify-between w-full pb-1">
                                        <label className=' flex px-1 z-10 font-semibold text-zinc-700 text-sm rounded-full ' htmlFor="password">
                                            {/* <LockKeyhole className="size-4" strokeWidth={1} /> */}
                                            Password
                                        </label>
                                        {
                                            (curr_shown === 'login') &&
                                            <div onClick={() => { set_curr_shown('forgot') }} className=" hover:underline underline-offset-2 text-sm font-light font-zinc-900  cursor-pointer">
                                                Forgot password?
                                            </div>
                                        }
                                    </div>
                                    <input
                                        name='password'
                                        type="password"
                                        required
                                        value={password}
                                        placeholder="password"
                                        className='border border-zinc-300 bg-white focus:bg-white outline-none py-3 pl-4 pr-2 min-w-96 rounded-2xl w-full'
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            }
                        </div>

                        {/* SUBMIT BUTTON */}
                        <button type="submit" className=' cursor-pointer mt-3 outline-none flex gap-3 items-center justify-center p-3 font-medium bg-primary hover:bg-primary/90 text-zinc-50 rounded-2xl transition-all'>
                            <div>
                                {curr_shown === 'signup' ? 'Create Account' : curr_shown === 'login' ? 'Log In' : 'Submit'}
                            </div>
                            {
                                loading &&
                                <div role="status">
                                    <Loader2 className="size-6 text-sky-300 animate-spin stroke-white" />
                                </div>
                            }
                        </button>
                    </form>

                    {/* PROVIDERS */}
                    <div className=" w-full  ">
                        {
                            curr_shown !== 'forgot' &&
                            <>
                                <div className='flex items-center gap-3 '>
                                    <div className='w-32 h-[1px] bg-gray-400' />
                                    <div className=" text-sm text-gray-600">
                                        Or continue with
                                    </div>
                                    <div className='w-32 h-[1px] bg-gray-400' />
                                </div>
                                {/* OTHER PROVIDERS */}
                                < button
                                    onClick={(e) => { e.preventDefault(); handleGoogleSignIn() }}
                                    className=' mt-5 w-full flex items-center gap-2 border border-gray-300 px-4 py-3 min-w-80 rounded-2xl bg-zinc-50 hover:bg-white transition-all'
                                >
                                    <span>
                                        <Google className="" />
                                    </span>
                                    Continue with Google
                                </button>


                                {/* OR */}
                            </>
                        }
                    </div>

                    {/* SIGNUP */}
                    <div className='text-sm font-semibold text-center  '>
                        {
                            curr_shown === 'signup' &&
                            <>
                                Already have an account?
                                <span onClick={() => { set_curr_shown('login'); setEmail(''); setPassword('') }} className=' px-2 underline cursor-pointer text-primary'>
                                    Login
                                </span>
                            </>
                        }
                        {
                            (curr_shown === 'login' || curr_shown === 'forgot') &&
                            <>
                                Don&apos;t have an account?
                                <span onClick={() => { set_curr_shown('signup'); setEmail(''); setPassword('') }} className=' px-2 underline underline-offset-4 cursor-pointer text-primary'>
                                    Create an account
                                </span>
                            </>
                        }
                    </div>
                </div>

            </div >

            {/* MESSAGE NOTIFICATION */}
            {show_message && (
                <div className="absolute bottom-5 right-5  bg-primary text-white shadow min-h-20 w-64 rounded-3xl px-3 pt-6 pb-4 flex justify-between">
                    <div className="w-full font-light text-lg pt-4 pl-2 break-words">
                        {show_message}
                    </div>
                    <div onClick={() => { set_show_message(false) }}>
                        <XCircle className="absolute right-2 top-2 size-8 cursor-pointer" strokeWidth={1} />
                    </div>
                </div>
            )}

        </>
    )
}

export default Login_block