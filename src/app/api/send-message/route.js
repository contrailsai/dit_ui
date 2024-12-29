import { NextResponse } from 'next/server';
import { sqsClient } from '@/utils/sqs';
import { createClient } from "@/utils/supabase/server";
import { SendMessageCommand } from "@aws-sdk/client-sqs";
import { publishSNSMessage } from '@/utils/sns';

export async function POST(request) {
  const { task_id, method } = await request.json();
  // Check Supabase authentication
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    // SEND THE SQS MESSAGE WITH THE TRANSACTION ID 
    const sqsCommand = new SendMessageCommand({
      QueueUrl: process.env.NEXT_PUBLIC_ENVIRONMENT === "production" ? process.env.SQS_QUEUE_URL : process.env.DEV_SQS_QUEUE_URL,
      MessageBody: JSON.stringify(
        {
          task_id: task_id,
          application: method === "verification" ? "dit" : "admin_demo"
        }
      )
    });

    await sqsClient.send(sqsCommand);

    //SEND SNS TO START ANALYSIS
    let message = {
      "message": "Starting Instance ",
      "data": {}
    }
    if(process.env.NEXT_PUBLIC_ENVIRONMENT == "production"){
      console.log("Sending SNS message to start instance")
      await publishSNSMessage(message, 'instance');
    }
    console.log("Task submitted")
    return NextResponse.json({ message: "Task submitted" }, { status: 200 });

  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: "Error generating signed URL or saving metadata" }, { status: 500 });
  }
}