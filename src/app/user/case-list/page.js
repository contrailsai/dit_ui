// HISTORY OF ALL TRANSACTIONS BY USER ALONG WITH PENDING TRANSACATIONS

import { get_user_data } from "@/utils/data_fetch";
import Navbar from "@/components/Navbar";
import Transactions_history from "./Transactions_history";
import Footer from "@/components/Footer";

const history = async () => {
    const user = await get_user_data();

    return (
        <>
            <Navbar user_data={user} />
            <Transactions_history verifier={user.verifier} />
            <Footer/>
        </>
    )
}

export default history;