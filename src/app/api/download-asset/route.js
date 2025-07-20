import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from "@/utils/supabase/server";

export async function GET(request) {

    const { searchParams } = new URL(request.url);
    const mediaUrl = searchParams.get('url');
    const filename = searchParams.get('filename');

    // Check Supabase authentication
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    try {
        const response = await fetch(mediaUrl);
        const arrayBuffer = await response.arrayBuffer();
    
        // Create headers to force download
        const headers = new Headers();
        headers.set('Content-Type', 'application/octet-stream');
        headers.set('Content-Disposition', `attachment; filename=${filename}`);
    
        // Return the response with proper headers
        return new Response(arrayBuffer, {
          headers: headers,
        });

    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: "Error generating signed URL or creating asset" }, { status: 500 });
    }
}