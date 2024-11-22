import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

// Create an SNS client with your AWS credentials
const snsClient = new SNSClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

export async function publishSNSMessage(message, type) {
    try {
        const publishCommand = new PublishCommand({
            TopicArn: type==='email'? process.env.SNS_EMAIL_TOPIC_ARN : process.env.SNS_INSTANCE_TOPIC_ARN,
            Message: JSON.stringify(message),
        });

        const resp = await snsClient.send(publishCommand);
        console.log("Message published to SNS successfully", resp);
        return true
    } catch (error) {
        console.error("Error publishing message to SNS:", error);
        return false
    }
}
