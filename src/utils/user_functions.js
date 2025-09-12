"use server"
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

// get user data
export const get_user_data = async () => {

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    //IF NO USER LOGIN RETURN UNDEFINED 
    if (user === null) {
        return;
    }
    const user_id = user.id;

    //FETCH TOKENS
    const { data: [token_data], error } = await supabase
        .from('Tokens')
        .select('token_amount,verifier')
        .eq('id', user_id);

    // data =  [ { token_amount: 500 } ]
    // console.log(token_data, error, user_id)
    if (error || token_data === undefined) {

        error !== null ? console.error("ERROR IN GETTING USER'S TOKENS: ", error) : console.error("error in getting user tokens: user not defined in tokens db");
        return { error: "error in getting user tokens" }
    }

    const user_data = { ...user.user_metadata, "id": user_id, tokens: token_data.token_amount, verifier: token_data.verifier }

    return user_data;
}

// update user tokens
export const update_user_tokens = async (user_id, new_token_amount) => {
    const supabase = await createServerSupabaseClient();

    const { error } = await supabase
        .from('Tokens')
        .update({ "token_amount": new_token_amount })
        .eq('id', user_id);

    if (error) {
        console.error("ERROR IN UPDATING USER'S TOKENS: ", error);
        return { success: false, error: "error in updating user tokens" }
    }

    return { success: true };
}

// logout user
export const user_logout = async () => {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user === null)
        return;

    await supabase.auth.signOut();
    return redirect("/login");
}

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

// SignIn (email pass) / (google)
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
        console.error("User SignIn Error: ", e);
        return redirect("/login?message=Could not authenticate user");
    }
    return redirect("/fact-checker");
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


// SignUp
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

// Password related
export const forgot_password = async ({ email }) => {
    const supabase = await createServerSupabaseClient();
    const origin = headers().get("origin");

    const { error } = await supabase.auth.resetPasswordForEmail(email)

    if (error) {
        console.log(error);
        return redirect("/login?message=Could not verify user");
    }
};

export const password_update = async ({ password }) => {
    const supabase = await createServerSupabaseClient();

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
        console.log(error);
        return redirect("/login?message=Could not update user");
    }

    return redirect("/");
}
