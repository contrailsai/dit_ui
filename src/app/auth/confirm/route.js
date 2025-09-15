import { NextResponse, NextRequest } from 'next/server'
// The client you created from the Server-Side Auth instructions
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { redirect } from 'next/navigation'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/'
  const redirectTo = request.nextUrl.clone()
  // redirectTo.pathname = next

  if (token_hash && type) {
    const supabase = await createServerSupabaseClient();

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
    if (!error) {
      redirect("/auth/update-password");
    }
  }
  const requestUrl = new URL(request.url);
  const origin = requestUrl.origin;
  return NextResponse.redirect(`${origin}/login?message=Could not authenticate user`);
  
}