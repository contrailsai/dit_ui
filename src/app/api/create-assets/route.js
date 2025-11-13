import { NextResponse } from 'next/server';
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3ClientASIA, s3ClientUS } from "@/utils/s3";
// import { sqsClient } from '@/utils/sqs';
import { createServerSupabaseClient } from "@/lib/supabase/server";
// import { SendMessageCommand } from "@aws-sdk/client-sqs";
// import { publishSNSMessage } from '@/utils/sns';

// Define the countries that should primarily use the US East 1 bucket (NA, SA, Europe)
const US_EAST_COUNTRIES = [
    'US', 'CA', 'MX', // North America
    'GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'PL', 'UA', // Europe
    'BR', 'AR', 'CO', 'CL', // South America
];

export async function POST(request) {

    const countryCode = request.headers.get('x-vercel-ip-country')?.toUpperCase();
    let bucketName;
    let S3Client;

    // Determine the nearest bucket based on the country codes (use US bucket for ameraicas and Europe)
    if (countryCode && US_EAST_COUNTRIES.includes(countryCode)) {
        bucketName = process.env.S3_BUCKET_NAME_US;
        S3Client = s3ClientUS;
    } else {
        bucketName = process.env.S3_BUCKET_NAME_ASIA;
        S3Client = s3ClientASIA;
    }

    // If the preferred bucket name is missing, fall back to the other one if available
    if (!bucketName) {
        bucketName = process.env.S3_BUCKET_NAME_US || process.env.S3_BUCKET_NAME_ASIA;
        S3Client = (bucketName === process.env.S3_BUCKET_NAME_US) ? s3ClientUS : s3ClientASIA;
        if (!bucketName) {
            console.error("Critical: Both US_BUCKET_NAME and ASIA_BUCKET_NAME are missing.");
            return NextResponse.json({ error: "S3 Bucket names are not configured correctly." }, { status: 500 });
        }
    }
    console.log("Detected country code:", countryCode, "Using bucket:", bucketName);


    const { uploaded_assets, T_id } = await request.json();
    // Check Supabase authentication
    const supabase = await createServerSupabaseClient();
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
                Bucket: bucketName,
                Key: `assets/${asset.id}`,
                ContentType: asset.type,
            });
            const signedUrl = await getSignedUrl(S3Client, command, { expiresIn: 300 });

            response_data[asset.id] = { ...asset, signedUrl }
        }

        return NextResponse.json(response_data);

    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: "Error generating signed URL or creating asset" }, { status: 500 });
    }
}