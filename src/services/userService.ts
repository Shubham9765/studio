
import { db } from './firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import type { Address } from '@/hooks/use-auth';

interface UserProfileData {
    displayName?: string;
    address?: string; // Can be removed if fully migrated
    addresses?: Address[];
}

export async function updateUserProfile(userId: string, data: UserProfileData): Promise<void> {
  if (!userId) {
    throw new Error('User ID is required to update profile.');
  }

  const userRef = doc(db, 'users', userId);
  
  const updateData: { [key: string]: any } = {};

  if (data.displayName) {
      updateData.username = data.displayName; // Keep `username` in sync
      updateData.displayName = data.displayName;
  }
  
  if (data.addresses) {
      updateData.addresses = data.addresses;
  }

  if (Object.keys(updateData).length === 0) {
      // Nothing to update
      return;
  }

  await updateDoc(userRef, updateData);
}

    