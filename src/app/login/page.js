import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Login_block from "./Login_block";
import { headers } from "next/headers";

export default async function Login() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    console.log("user logged in but went to login page");
    return redirect("/fact-checker");
  }

  const signIn = async ({ email, password }) => {
    "use server";
    const supabase = await createClient();
    try{

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.log(error);
        return redirect("/login?message=Could not authenticate user");
      }
    }
    catch(e){
      console.error("Error: ", e);
      return redirect("/login?message=Could not authenticate user");
    }
    return redirect("/fact-checker");
  };

  const signUp = async ({ email, password }) => {
    "use server";
    const origin = headers().get("origin");
    const supabase = await createClient();

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
      },
    });

    if (error) {
      console.log(error);
      return redirect("/login?message=Could not authenticate user");
    }

    return redirect("/login?message=Check email to continue sign-in process");
  };

  const handleGoogleSignIn = async () => {
    "use server";
    const origin = headers().get("origin");
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
    });

    if (error) {
      return redirect("/login?message=Could not authenticate user");
    }

    if (data.url) {
      redirect(data.url);
    }
  };

  const forgot_password = async ({ email }) => {
    "use server";
    const supabase = await createClient();
    const origin = headers().get("origin");

    const { error } = await supabase.auth.resetPasswordForEmail(email)

    if (error) {
      console.log(error);
      return redirect("/login?message=Could not verify user");
    }
  };

  return (
    <>
      <div className='flex flex-col justify-between h-screen items-center bg-white'>
        <Login_block
          signIn={signIn}
          signUp={signUp}
          handleGoogleSignIn={handleGoogleSignIn}
          forgot_password={forgot_password}
        />

        <div className='flex pb-4 text-black font-medium divide-x-2 divide-black'>
          <div className='hover:underline underline-offset-4 text-center px-3'>
            <Link href={'/terms-of-service'}>Terms of Service</Link>
          </div>
          <div className='hover:underline underline-offset-4 px-3'>
            <Link href={'/privacy-policy'}>Privacy Policy</Link>
          </div>
        </div>
      </div>
    </>
  );
}
