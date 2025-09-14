
import { redirect } from "next/navigation";
import VideoAnalysisForm from "./Videofile";

import { get_user_data } from "@/utils/data_fetch";


export default async function ProtectedPage() {
    
    const user = await get_user_data();

    if (!user) {
        return redirect("/login");
    }
    if (!user.verifier){
        return redirect("/media-checker");
    }

    return (
        <div>
            <VideoAnalysisForm user={user} />
        </div>
    );
}
