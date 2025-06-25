"use server"
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/utils/supabase/server";
import { headers } from "next/headers";

export const signIn = async ({ email, password }) => {
    const supabase = await createServerSupabaseClient();
    try {

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            console.log(error);
            return redirect("/login?message=Wrong email or password");
        }
    }
    catch (e) {
        console.error("Error: ", e);
        return redirect("/login?message=Could not authenticate user");
    }
    return redirect("/fact-checker");
};

export const signUp = async ({ email, password }) => {
    const origin = headers().get("origin");
    const supabase = await createServerSupabaseClient();

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

export const handleGoogleSignIn = async () => {
    const origin = headers().get("origin");
    const supabase = await createServerSupabaseClient();

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

export const forgot_password = async ({ email }) => {
    const supabase = await createServerSupabaseClient();
    const origin = headers().get("origin");

    const { error } = await supabase.auth.resetPasswordForEmail(email)

    if (error) {
        console.log(error);
        return redirect("/login?message=Could not verify user");
    }
};

export const check_login = async () => {
    const supabase = await createServerSupabaseClient();
    
    const { data: { user }, error } = await supabase.auth.getUser();
  
    if (error) {
        console.log("no user logged in :", error);
        return;
    }

    if (user) {
        console.log("User logged in but went to login page");
        return redirect("/fact-checker");
    }
}

export const password_update = async ({ password }) => {
    const supabase = await createServerSupabaseClient();

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
        console.log(error);
        return redirect("/login?message=Could not update user");
    }

    return redirect("/");
}
