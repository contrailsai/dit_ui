'use client'
import Image from "next/image";
import { password_update } from "@/utils/user_functions"
import { useState } from "react";
import { Loader2, Mail, LockKeyhole } from "lucide-react";

const ResetPasswordBlock = ({ user, eventInfo }) => {

    const email = user.email;
    const [password, setPassword] = useState('');

    const [show_message, set_show_message] = useState(eventInfo?.message);

    const [loading, setloading] = useState(false);

    const handle_password_update = async (e) => {
        e.preventDefault();
        setloading(true);

        try {
            await password_update({ password });
        }
        catch (error) {
            console.log(error);
            window.location.href = "/login?message=Could not update user";
        }
        finally {
            setloading(false);
            window.location.href = "/";
        }
    }

    return (
        <>
            <div className="shadow-card border border-slate-200 bg-white mt-10 flex flex-col items-stretch w-fit py-10 px-10 rounded-3xl text-slate-800">

                <div className="text-primary w-full text-xl font-bold pb-7 flex justify-start items-center gap-3">
                    <Image src="/logo.png" width={30} height={20} alt="LOGO" />
                    <span className="font-bold text-2xl text-primary">Contrails AI</span>
                </div>

                <div className="text-3xl font-semibold tracking-tight text-slate-900">
                    Reset Password
                </div>
                <div className="font-light mb-4 text-slate-500">
                    Enter email and updated password
                </div>

                <form onSubmit={handle_password_update} className="flex flex-col gap-6">
                    <div className="relative">
                        <label className="flex px-1 gap-1 absolute z-10 font-medium text-xs -top-2 left-5 bg-white rounded-full text-slate-600" htmlFor="email">
                            <Mail className="size-4" strokeWidth={1} />
                            Email
                        </label>
                        <input
                            name="email"
                            type="email"
                            required
                            value={email}
                            className="border border-slate-200 bg-slate-50 outline-none py-3 pl-6 pr-2 min-w-96 rounded-full w-full"
                            disabled
                        />
                    </div>
                    <div className="relative">
                        <label className="flex px-1 gap-1 absolute z-10 font-medium text-xs -top-2 left-5 bg-white rounded-full text-slate-600" htmlFor="password">
                            <LockKeyhole className="size-4" strokeWidth={1} />
                            New Password
                        </label>
                        <input
                            name="password"
                            type="password"
                            required
                            minLength={8}
                            value={password}
                            className="border border-slate-200 bg-white focus:border-primary outline-none py-3 pl-6 pr-2 min-w-96 rounded-full w-full"
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button type="submit" className="mt-1 outline-none flex gap-3 items-center justify-center p-3 font-medium bg-primary hover:bg-primary/90 text-white rounded-full shadow-sm transition-all">
                        <div>Submit</div>
                        {loading && <Loader2 className="size-6 animate-spin stroke-white" />}
                    </button>
                </form>

            </div>
        </>
    )
}

export default ResetPasswordBlock;
