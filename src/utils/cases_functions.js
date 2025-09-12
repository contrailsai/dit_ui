"use server"
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
// import { redirect } from "next/navigation";
// import { headers } from "next/headers";
import { get_user_data } from "@/utils/user_functions";
import { getSignedUrl } from '@aws-sdk/cloudfront-signer';

// get cases list based on user's role 
export const get_user_transactions = async () => {

    const supabase = await createServerSupabaseClient();
    const user = await get_user_data();

    if (user === null)
        return;

    let transactions_list = {}
    if (user.verifier) {
        //get data from db and return it 
        transactions_list = await supabase
            .from('Transactions')
            .select('id,created_at,input_request,file_metadata,status,prediction,method')
    }
    else {
        //get data from db and return it 
        transactions_list = await supabase
            .from('Transactions')
            .select('id,created_at,input_request,file_metadata,status,prediction,method')
            .eq('user_id', user.id)
    }


    if (transactions_list.error) {
        console.error(transactions_list.error)
        return {
            "error": "error in getting user history"
        }
    }
    // SORT DATA BY DATE REVERSE ORDER
    transactions_list.data.sort((x, y) => {
        const timex = new Date(x.created_at).getTime()
        const timey = new Date(y.created_at).getTime()
        return -(timex - timey)
    })

    let t_list = transactions_list.data.filter((val, idx) => {
        if (!val.method)
            return true
        if (val.method == 'verification')
            return true
        else
            return false
    })

    return { user, t_list }; //transactions_list.data;
}

export const get_demo_transactions = async () => {

    const supabase = await createServerSupabaseClient();
    const user = await get_user_data();

    if (user === null || !user.verifier)
        return;

    let transactions_list = {}
    if (user.verifier) {
        //get data from db and return it 
        transactions_list = await supabase
            .from('Transactions')
            .select('id,created_at,input_request,file_metadata,status,prediction,method')
            .eq('method', "demo")
    }

    if (transactions_list.error) {
        console.error(transactions_list.error)
        return {
            "error": "error in getting user history"
        }
    }
    // SORT DATA BY DATE REVERSE ORDER
    transactions_list.data.sort((x, y) => {
        const timex = new Date(x.created_at).getTime()
        const timey = new Date(y.created_at).getTime()
        return -(timex - timey)
    })
    return { user, t_list: transactions_list.data }; //transactions_list.data;
}

export const get_result_for_id = async (transaction_id) => {

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user === null)
        return;

    //get data from db and return it 
    const { data, error } = await supabase
        .from('Transactions')
        .select('*')
        .eq('id', transaction_id)
        .single()

    if (error) {
        console.error(error)
        return {
            "error": "error in getting user history"
        }
    }
    //GET S3 media file here
    // Add the signed URL to the data object
    data.signedUrl = await get_signed_url(data.media_key);
    return data;
}

export const get_assets_for_id = async (transaction_id) => {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user === null)
        return;

    //get data from db and return it 
    const { data, error } = await supabase
        .from('Assets')
        .select('*')
        .eq('transaction_id', transaction_id)

    if (error) {
        console.error(error)
        return {
            "error": "error in getting user history"
        }
    }
    // console.log(data, transaction_id)
    let assets_data = []
    for (let asset of data) {
        const signedUrl = await get_signed_url(`assets/${asset.id}`);
        assets_data.push({
            "signedUrl": signedUrl,
            "name": asset.name,
            "type": asset.type,
            "id": asset.id
        });
    }
    return assets_data;
}

export const get_signed_url = async (key) => {

    const keyPairId = process.env.CLOUDFRONT_PUBLIC_KEY_ID;
    const CDN_URL = process.env.CDN_URL;
    const privateKey = process.env.PRIVATE_KEY;
    if (!keyPairId || !CDN_URL || !privateKey) {
        console.error("Missing environment variables for CloudFront signing.");
        return null
    }

    const url = `${CDN_URL}/${key}`;

    // The URL will be valid for 1 hour from the time of creation.
    const expirationDate = new Date();
    expirationDate.setMinutes(expirationDate.getMinutes() + 60); // URL valid for 60 minutes

    const signedUrl = getSignedUrl({
        url: url,
        keyPairId: keyPairId,
        privateKey: privateKey,
        dateLessThan: expirationDate.toISOString(), // The policy expiration date
    });

    return signedUrl;
}

export const get_user_email_by_id = async (id) => {

    const supabase = createAdminClient()
    const { data: { user: { email } }, error } = await supabase.auth.admin.getUserById(id) //.getUserById(id)
    // console.log(email);
    return email
}

export const verify_case = async (id, metadata, user_id, prediction) => {

    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    // console.log('Transaction ID:', id);

    const result = await supabase
        .from('Transactions')
        .update({
            status: true,
            prediction: prediction,
            verifier_metadata: { ...metadata, verifier_id: user.id }
        })
        .match({ id });

    // get client's email
    let email = await get_user_email_by_id(user_id)

    if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'production') {

        let message = {
            "notification_type": "client",
            "client_id": user_id,
            "client_email": email,
            "status": "PROCESSING_COMPLETED",
            "data": {
                "id": id,
            }
        }
        await publishSNSMessage(message, 'email');
        console.log("sent email to user at: ", email);
    }

    if (result.error) {
        console.error('Update Error:', result.error);
        return -1;
    }

    return 0;
};

export const delete_asset_by_id = async (id) => {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
        .from('Assets')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting asset:', error);
        return { error: 'error in deleting asset' };
    }

    return { success: true, data };
}