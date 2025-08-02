
'use server';

/**
 * @fileOverview A server-side flow to send FCM notifications.
 *
 * - sendFcmNotification - A function that sends a push notification to a user.
 * - SendFcmNotificationInput - The input type for the sendFcmNotification function.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getDoc, doc } from 'firebase/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { app } from '@/services/firebaseAdmin';
import { db } from '@/services/firebase';

const SendFcmNotificationInputSchema = z.object({
    userId: z.string().describe('The ID of the user to send the notification to.'),
    title: z.string().describe('The title of the notification.'),
    body: z.string().describe('The body content of the notification.'),
    url: z.string().describe('The URL to open when the notification is clicked.'),
});
export type SendFcmNotificationInput = z.infer<typeof SendFcmNotificationInputSchema>;

export async function sendFcmNotification(input: SendFcmNotificationInput): Promise<void> {
    return sendFcmNotificationFlow(input);
}

const sendFcmNotificationFlow = ai.defineFlow(
  {
    name: 'sendFcmNotificationFlow',
    inputSchema: SendFcmNotificationInputSchema,
    outputSchema: z.void(),
  },
  async (input) => {
    try {
        const userDocRef = doc(db, 'users', input.userId);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
            console.warn(`User document not found for userId: ${input.userId}`);
            return;
        }

        const fcmToken = userDoc.data()?.fcmToken;

        if (!fcmToken) {
            console.warn(`FCM token not found for userId: ${input.userId}`);
            return;
        }

        const message = {
            notification: {
                title: input.title,
                body: input.body,
            },
            webpush: {
                fcm_options: {
                    link: input.url,
                },
                notification: {
                    icon: '/favicon.ico',
                }
            },
            token: fcmToken,
        };

        await getMessaging(app).send(message);
        console.log(`Successfully sent message to user ${input.userId}`);

    } catch (error) {
      console.error('Error sending FCM message:', error);
      // We don't rethrow the error to prevent the caller from failing if notifications fail.
    }
  }
);
