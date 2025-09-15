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
            <div className=' shadow border border-primary/20 bg-white/70 backdrop-blur-sm mt-10 flex flex-col items-stretch w-fit py-10 px-10 rounded-3xl text-gray-800 '>

                {/* LOGO */}
                <div className=' text-primary w-full text-xl font-bold pb-7 flex justify-start items-center gap-3'>
                    <Image src={'/logo.png'} width={30} height={20} alt="LOGO" />
                    <span className="font-bold text-2xl text-[#2530FF]">
                        Contrails AI
                    </span>
                </div>

                <div className=" text-3xl font-semibold">
                    {curr_shown === 'signup' && 'Create your Account'}
                    {curr_shown === 'login' && 'Login to your Account'}
                    {curr_shown === 'forgot' && 'Reset your Account Password'}
                </div>
                <div className=' font-light mb-2'>
                    {curr_shown === 'signup' && 'Hello! select method of signup:'}
                    {curr_shown === 'login' && 'Welcome back! select method to login:'}
                    {curr_shown === 'forgot' && 'Enter email :'}
                </div>


                {
                    curr_shown !== 'forgot' &&
                    <>
                        {/* OTHER PROVIDERS */}
                        < button
                            onClick={(e) => { e.preventDefault(); handleGoogleSignIn() }}
                            className=' mt-5 flex items-center gap-2 border border-gray-300 px-4 py-3 min-w-80 rounded-full bg-gray-50 transition-all'
                        >

                            <span>
                                <Google className="" />
                            </span>

                            Continue with Google
                        </button>


                        {/* OR */}
                        <div className='flex items-center gap-3 pt-7  pb-5'>

                            <div className='w-32 h-[1px] bg-gray-400' />
                            <div className=" text-sm text-gray-600">
                                or continue with email
                            </div>
                            <div className='w-32 h-[1px] bg-gray-400' />
                        </div>
                    </>
                }

                {/* FORM */}
                <form onSubmit={handle_pass_signin} className=' flex flex-col gap-2'>
                    <div className="flex flex-col gap-6">
                        <div className="relative">
                            <label className=' flex px-1 gap-1 absolute z-10 font-medium text-xs -top-2 left-5 bg-gradient-to-t from-white to-transparent rounded-full ' htmlFor="email">
                                <Mail strokeWidth={1} className="size-4" />
                                Email
                            </label>
                            <input
                                name='email'
                                type="email"
                                required
                                value={email}
                                className='border border-gray-300 bg-white focus:bg-white outline-none py-3 pl-6 pr-2 min-w-96 rounded-3xl w-full'
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        {
                            curr_shown !== 'forgot' &&
                            <div className="relative">
                                <label className=' flex px-1 gap-1 absolute z-10 font-medium text-xs -top-2 left-5 bg-gradient-to-t from-white to-transparent rounded-full ' htmlFor="password">
                                    <LockKeyhole className="size-4" strokeWidth={1} />
                                    Password
                                </label>
                                <input
                                    name='password'
                                    type="password"
                                    required
                                    value={password}
                                    className='border border-gray-300 bg-white focus:bg-white outline-none py-3 pl-6 pr-2 min-w-96 rounded-3xl w-full'
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        }
                    </div>
                    {
                        (curr_shown === 'login') &&
                        <div onClick={() => { set_curr_shown('forgot') }} className=" w-full text-sm font-semibold text-end text-primary cursor-pointer">
                            Forgot password?
                        </div>
                    }

                    {/* SUBMIT BUTTON */}
                    <button type="submit" className=' cursor-pointer mt-3 outline-none flex gap-3 items-center justify-center p-3 font-medium bg-primary hover:bg-primary/90 text-white rounded-3xl transition-all'>
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

                    <div className=' text-sm font-semibold text-center mt-5  '>
                        {
                            curr_shown === 'signup' &&
                            <>
                                Already have an account?
                                <span onClick={() => { set_curr_shown('login'); setEmail(''); setPassword('') }} className=' px-2 cursor-pointer text-primary'>
                                    Login
                                </span>
                            </>
                        }
                        {
                            (curr_shown === 'login' || curr_shown === 'forgot') &&
                            <>
                                Don&apos;t have an account?
                                <span onClick={() => { set_curr_shown('signup'); setEmail(''); setPassword('') }} className=' px-2 cursor-pointer text-primary'>
                                    Create an account
                                </span>
                            </>
                        }
                    </div>

                </form>

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