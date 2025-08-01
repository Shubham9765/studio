
import { db } from './firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

interface UserProfileData {
    displayName: string;
    address: string;
}

export async function updateUserProfile(userId: string, data: UserProfileData): Promise<void> {
  if (!userId) {
    throw new Error('User ID is required to update profile.');
  }

  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
      username: data.displayName, // Keep `username` in sync with `displayName`
      displayName: data.displayName,
      address: data.address,
  });
}
