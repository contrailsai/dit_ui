import Link from "next/link";
import Login_block from "./login_block";
import { WavyBackground } from "@/components/wavy-background"
import { check_login } from "@/utils/user_functions";

export default async function Login() {
    await check_login();

    return (
        <>
            <div className=' relative flex flex-col justify-between h-screen items-center bg-white'>

                <div className="absolute left-0 top-0 h-full max-h-screen overflow-hidden w-full text-primary" >
                    <WavyBackground
                        colors={["#0253FF", "#0253FF", "#0253FF", "#0253FF", "#FFFFFF"]}
                        blur={20}
                        waveWidth={100}
                        backgroundFill={"#DDEEFF"}
                        className={"h-full"} />
                </div>

                <div className=" z-10 ">

                    <Login_block />

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
