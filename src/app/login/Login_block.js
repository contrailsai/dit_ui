'use client'
import Image from "next/image";
import { useState, useEffect } from "react";
import { EmailMessage, ClosedLock, Google, LoadingCircle, CrossCircle } from "@/components/SVGs";
import { getUrlParam } from "@/utils/url_params";
import { useSearchParams } from 'next/navigation';

const Login_block = ({ signIn, signUp, handleGoogleSignIn, forgot_password }) => {

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
            <div className=' shadow border border-primary bg-white/70 backdrop-blur-sm mt-10 flex flex-col items-stretch w-fit py-10 px-10 rounded-3xl text-gray-800 '>

                {/* LOGO */}
                <div className=' text-primary w-full text-xl font-bold pb-7 flex justify-between items-end'>
                    <Image src={'/logo.svg'} width={150} height={20} alt="LOGO" />
                    <span className="text-[#2530ff] text font-bold flex flex-row items-center gap-2 ">
                        <Image src={'/contrails_logo.png'} width={21} height={14} alt="logo 2" /> 
                        Contrails AI
                    </span>
                </div>

                <div className=" text-2xl font-semibold">
                    {curr_shown === 'signup' && 'Create your Account'}
                    {curr_shown === 'login' && 'Login to your Account'}
                    {curr_shown === 'forgot' && 'Reset your Account Password'}
                </div>
                <div className=' font-light mb-2'>
                    {curr_shown === 'signup' && 'Hello! select method of signup:'}
                    {curr_shown === 'login' && 'Welcome back! select method to login:'}
                </div>


                {
                    curr_shown !== 'forgot' &&
                    <>
                        {/* OTHER PROVIDERS */}
                        < button
                            onClick={(e) => { e.preventDefault(); handleGoogleSignIn() }}
                            className=' mt-5 flex items-center gap-2 border px-4 py-3 min-w-80 border-gray-300 rounded-3xl bg-gray-50 transition-all'
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
                                <EmailMessage strokeWidth={1} className="size-4" />
                                Email
                            </label>
                            <input
                                name='email'
                                type="email"
                                required
                                value={email}
                                className='border-2 bg-gray-50 focus:bg-white outline-none py-3 pl-6 pr-2 min-w-96 rounded-3xl w-full'
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        {
                            curr_shown !== 'forgot' &&
                            <div className="relative">
                                <label className=' flex px-1 gap-1 absolute z-10 font-medium text-xs -top-2 left-5 bg-gradient-to-t from-white to-transparent rounded-full ' htmlFor="password">
                                    <ClosedLock className="size-4" strokeWidth={1} />
                                    Password
                                </label>
                                <input
                                    name='password'
                                    type="password"
                                    required
                                    value={password}
                                    className='border-2 bg-gray-50 focus:bg-white outline-none py-3 pl-6 pr-2 min-w-96 rounded-3xl w-full'
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        }
                    </div>
                    {
                        (curr_shown === 'login') &&
                        <div onClick={() => { set_curr_shown('forgot') }} className=" w-full text-sm text-end text-primary cursor-pointer">
                            Forgot password?
                        </div>
                    }
                    <button type="submit" className=' mt-3 outline-none flex gap-3 items-center justify-center p-3 font-medium bg-primary hover:bg-primary/90 text-white rounded-3xl transition-all'>
                        <div>
                            {curr_shown === 'signup' ? 'Create Account' : curr_shown === 'login' ? 'Log In' : 'Submit'}
                        </div>
                        {
                            loading &&
                            <div role="status">
                                <LoadingCircle className="w-6 h-6 text-stone-300 animate-spin fill-stone-600" />
                            </div>
                        }
                    </button>

                    <div className=' font-medium text-sm text-center mt-5 '>
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
                <div className="absolute bottom-10 right-10 bg-primary text-white shadow-md min-h-20 w-72 rounded-3xl px-3 pt-6 pb-4 flex justify-between">
                    <div className="w-full pt-3 pl-2 break-words">
                        {show_message}
                    </div>
                    <div onClick={() => { set_show_message(false) }}>
                        <CrossCircle className="absolute right-2 top-2 size-8 cursor-pointer" strokeWidth={1} />
                    </div>
                </div>
            )}

        </>
    )
}

export default Login_block