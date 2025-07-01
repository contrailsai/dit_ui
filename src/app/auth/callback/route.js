import { createServerSupabaseClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request) {
  // The `/auth/callback` route is required for the server-side auth flow implemented
  // by the SSR package. It exchanges an auth code for the user's session.
  // https://supabase.com/docs/guides/auth/server-side/nextjs
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error('Error exchanging code for session:', error);
      return NextResponse.redirect(`${origin}/login?message=Could not authenticate user`);
    }
    else {
      //  ENSURE THIS USER EXIST IN Tokens DB (if not create it)
      const userId = data.user.id;
      try {
        const { error: insertError } = await supabase
          .from('Tokens') // Ensure the table name is correct
          .insert([{ id: userId, token_amount: 0 }]);

        //ALREADY EXIST
        if (insertError.code === '23505') {
          console.log('USER ALREDY EXIST WITH TOKEN');
        }
      } catch (error) {
        console.error('Error creating token entry:', error);
      }
    }
  }

  // URL to redirect to after sign up process completes
  return NextResponse.redirect(`${origin}/fact-checker`);
}
