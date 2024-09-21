// HISTORY OF ALL TRANSACTIONS BY USER ALONG WITH PENDING TRANSACATIONS

import { get_user_data } from "@/utils/data_fetch";
import Navbar from "@/components/Navbar";
import Transactions_history from "./Transactions_history";
import Link from "next/link";

const history = async () => {
    const user = await get_user_data();

    return (
        <>
            <Navbar user_data={user} />
            <Transactions_history verifier={user.verifier} />
            {/* FOOTER */}
            <div className=' bg-white flex gap-3 py-2 justify-center items-center border-t border-primary '>
                <Link href={'https://contrails.ai'} target='_blank' className='hover:underline'>
                    Contrails AI
                </Link>
                ©2024
            </div>
        </>
    )
}

export default history;