import Link from "next/link";
import { redirect } from "next/navigation";
import ResetPasswordBlock from "./ResetPassword";
// import { headers } from "next/headers";
// import { check_login } from "@/utils/login_calls"
import { check_login } from "@/utils/user_functions"

export default async function Login({ searchParams }) {

    await check_login();

    return (
        <>
            <div className=' flex flex-col justify-between h-screen items-center bg-white'>

                <ResetPasswordBlock
                    user={user}
                    eventInfo={searchParams}
                />

                <div className='flex  pb-4 text-black font-medium divide-x-2 divide-black'>
                    <div className=' hover:underline underline-offset-4 text-center px-3'>
                        <Link href={'/terms-of-service'} > Terms of Service</Link>
                    </div>
                    <div className=' hover:underline underline-offset-4 px-3'>
                        <Link href={'/privacy-policy'} > Privacy Policy</Link>
                    </div>
                </div>

            </div>

        </>
    );
}
