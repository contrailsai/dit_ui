import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import ResetPasswordBlock from "./ResetPassword";
import { headers } from "next/headers";

export default async function Login({ searchParams }) {

    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return redirect("/login");
    }

    const update_password = async (password) => {
        "use server";

        try {
            await supabase.auth.updateUser({ password: password })
            return redirect("/fact-checker");
        }
        catch (error) {
            console.log(error);
            return redirect("/login?message=Could not update user");
        }
    }

    return (
        <>
            <div className=' flex flex-col justify-between h-screen items-center bg-white'>

                <ResetPasswordBlock
                    user={user}
                    update_password={update_password}
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
