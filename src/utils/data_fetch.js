"use server"
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

import { s3Client } from "@/utils/s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// get model response
export const db_updates = async ({ new_token_amount, user_id }) => {

    const supabase = createClient();
    //update user tokens
    const { token_data, token_error } = await supabase
        .from('Tokens')
        .update({ "token_amount": new_token_amount })
        .eq('id', user_id)
        .select()
    if (token_error) {
        console.error("ERROR: ", token_error)
        return { error: "error in updating tokens" }
    }
    return null;
}

// get user data
export const get_user_data = async () => {

    const supabase = createClient();
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
    if (error || token_data===undefined ) {
        
        error!==null?console.error("ERROR IN GETTING USER'S TOKENS: ", error): console.error("error in getting user tokens: user not defined in tokens db");
        return {error: "error in getting user tokens"}
    }

    const user_data = { ...user.user_metadata, "id": user_id, tokens: token_data.token_amount, verifier: token_data.verifier }

    return user_data;
}

// logout user
export const user_logout = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user === null)
        return;

    await supabase.auth.signOut();
    return redirect("/login");
}

export const get_user_transactions = async (verifier)=>{
    
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user === null)
        return;

    let transactions_list = {}
    if (verifier){
        //get data from db and return it 
        transactions_list = await supabase
        .from('Transactions')
        .select('id,created_at,input_request,file_metadata,status,prediction')
    }
    else{
        //get data from db and return it 
        transactions_list = await supabase
        .from('Transactions')
        .select('id,created_at,input_request,file_metadata,status,prediction')
        .eq('user_id', user.id) 
    }


    if (transactions_list.error){
        console.error(transactions_list.error)
        return {
            "error": "error in getting user history"
        }
    }
    // SORT DATA BY DATE REVERSE ORDER
    transactions_list.data.sort((x, y)=>{
        const timex = new Date(x.created_at).getTime()
        const timey = new Date(y.created_at).getTime()
        return -(timex-timey)
    })
    return transactions_list.data;
}


export const get_result_for_id = async (transaction_id)=>{
 
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user === null)
        return;

    //get data from db and return it 
    const {data, error} = await supabase
    .from('Transactions')
    .select('id,created_at,input_request,file_metadata,status,verifier_metadata,models_responses,media_key')
    .eq('id', transaction_id) 
    .single()

    if (error){
        console.error(error)
        return {
            "error": "error in getting user history"
        }
    }
    //GET S3 media file here

    // Generate a signed URL for the media file in S3
    let signedUrl = null;
    if (data.media_key) {
        try {
            const command = new GetObjectCommand({
                Bucket: process.env.S3_BUCKET_NAME,
                Key: data.media_key,
            });

            signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // URL valid for 1 hour
        } catch (s3Error) {
            console.error('Error generating signed URL:', s3Error);
        }
    }

    // Add the signed URL to the data object
    data.signedUrl = signedUrl;
    return data;
}

export const verify_case = async (id, metadata) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    // console.log('Transaction ID:', id);
    
    const result = await supabase
        .from('Transactions')
        .update({ 
            status: true,
            verifier_metadata: { ...metadata, verifier_id: user.id }
        })
        .match({ id });

    // console.log('Update Result:', result);

    if (result.error) {
        console.error('Update Error:', result.error);
        return -1;
    }

    return 0;
};

