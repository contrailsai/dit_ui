import { NextResponse } from 'next/server';
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client } from "@/utils/s3";
// import { sqsClient } from '@/utils/sqs';
import { createClient } from "@/utils/supabase/server";
// import { SendMessageCommand } from "@aws-sdk/client-sqs";
// import { publishSNSMessage } from '@/utils/sns';

export async function POST(request) {
    const { uploaded_assets, T_id } = await request.json();
    // Check Supabase authentication
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    try {
        //CREATE THE TRANSACTION IN DB
        const { data, error } = await supabase
            .from('Assets')
            .insert(uploaded_assets.map((asset) => {
                return {
                    "name": asset.name,
                    "type": asset.type,
                    "transaction_id": T_id
                }
            }))
            .select()

        if (error)
            throw error

        let response_data = {}
        for (let asset of data) {
            console.log("creating asset command for: ", asset)
            // GET SIGNED URL TO PUT DATA
            const command = new PutObjectCommand({
                Bucket: process.env.S3_BUCKET_NAME,
                Key: `assets/${asset.id}`,
                ContentType: asset.type,
            });
            const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

            response_data[asset.id] = {...asset, signedUrl}
        }

        return NextResponse.json(response_data);

    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: "Error generating signed URL or creating asset" }, { status: 500 });
    }
}