
import * as admin from 'firebase-admin';

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (!serviceAccount) {
    throw new Error('The FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set.');
}

const serviceAccountJson = JSON.parse(
    Buffer.from(serviceAccount, 'base64').toString('utf-8')
);

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccountJson),
        projectId: 'village-eats-et2ke',
    });
}

export const app = admin.apps[0]!;
