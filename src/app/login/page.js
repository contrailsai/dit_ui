import Link from "next/link";
import Image from "next/image";
import Login_block from "./Login_block";
import { signIn, signUp, handleGoogleSignIn, forgot_password, check_login } from "@/utils/login_calls"
import {WavyBackground} from "@/components/wavy-background"

export default async function Login() {
  await check_login();

  return (
    <>
      <div className=' relative flex flex-col justify-between h-screen items-center bg-red-500'>

        <div className="absolute left-0 top-0 h-full max-h-screen overflow-hidden w-full text-primary bg-white" >
          <WavyBackground colors={["#4d4d4f", "#4d4d4f", "#4d4d4f", "#4d4d4f", "#FFFFFF"]} blur={20} waveWidth={100} backgroundFill={"#FFF"} className={"h-full"}/>
          {/* <WavyBackground/>
          <WavyBackground/>
          <WavyBackground/> */}
          
        </div>

        <div className="relative z-10">

          <Login_block
            signIn={signIn}
            signUp={signUp}
            handleGoogleSignIn={handleGoogleSignIn}
            forgot_password={forgot_password}
          />

          <div className='flex justify-center pt-4 pb-4 text-black font-medium divide-x-2 divide-black'>
            <div className='hover:underline underline-offset-4 text-center px-3'>
              <Link href={'/terms-of-service'}>Terms of Service</Link>
            </div>
            <div className='hover:underline underline-offset-4 px-3'>
              <Link href={'/privacy-policy'}>Privacy Policy</Link>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
