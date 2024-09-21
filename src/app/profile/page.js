
import { redirect } from "next/navigation";
import { get_user_data } from "@/utils/data_fetch";


export default async function ProtectedPage() {
    
    const user = await get_user_data();

    if (!user) {
        return redirect("/login");
    }

    return (
        <div>
            PROFILE PAGE
        </div>
    );
}
