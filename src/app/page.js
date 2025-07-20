import Link from "next/link";
import { redirect } from "next/navigation";
import { get_user_data } from "@/utils/data_fetch";

export default async function Index() {

  const user = await get_user_data();

  if (!user) {
      return redirect("/login");
  }
  else{
    return redirect('/media-analyzer');
  }
  
  // return (
  //   <div className="flex-1 py-20 w-full h-screen flex flex-col gap-20 items-center bg-white">
      
  //     <Link href={'/login'} className=" w-fit px-60 bg-gray-100 border py-6 shadow rounded">
  //       LOGIN
  //     </Link>

  //     <Link href={'/media-analyzer'} className=" w-fit px-60 bg-gray-100 border py-6 shadow rounded">
  //       FACT CHECKER
  //     </Link>
      
  //   </div>
  // );
}
