import { s3Client } from "@/utils/s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from 'next/server';

// Define the countries that should primarily use the US East 1 bucket (NA, SA, Europe)
const US_EAST_COUNTRIES = [
    'US', 'CA', 'MX', // North America
    'GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'PL', 'UA', // Europe
    'BR', 'AR', 'CO', 'CL', // South America
];

export async function POST(request) {
    const countryCode = request.headers.get('x-vercel-ip-country')?.toUpperCase();
    let bucketName;

    // Determine the nearest bucket based on the country codes (use US bucket for ameraicas and Europe)
    if (countryCode && US_EAST_COUNTRIES.includes(countryCode)) {
        bucketName = process.env.S3_BUCKET_NAME_US;
    } else {
        bucketName = process.env.S3_BUCKET_NAME_ASIA;
    }

    // If the preferred bucket name is missing, fall back to the other one if available
    if (!bucketName) {
        bucketName = process.env.S3_BUCKET_NAME_US || process.env.S3_BUCKET_NAME_ASIA;
    }
    if (!bucketName) {
        console.error("Critical: Both US_BUCKET_NAME and ASIA_BUCKET_NAME are missing.");
        return NextResponse.json({ error: "S3 Bucket names are not configured correctly." }, { status: 500 });
    }
    console.log("Detected country code:", countryCode, "Using bucket:", bucketName);

    const { media_key } = await request.json();

    const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: media_key,
    });

    try{
        const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        return NextResponse.json({ signed_url: signedUrl });
    }
    catch (error){
        console.error("Error generating signed URL:", error);
        return NextResponse.json({ error: "Error generating signed URL" }, { status: 500 });
    }
}