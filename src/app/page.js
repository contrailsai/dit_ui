import Link from "next/link";
import { redirect } from "next/navigation";
import { get_user_data } from "@/utils/user_functions";

export default async function Index() {

  const user = await get_user_data();

  if (!user) {
    return redirect("/login");
  }
  else {
    return redirect('/media-checker');
  }
}
