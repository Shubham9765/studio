
'use server';

import { db } from './firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import type { Address } from '@/hooks/use-auth';

interface UserProfileData {
    displayName?: string;
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

export async function updateDeliveryBoyLocation(deliveryBoyId: string, location: { latitude: number; longitude: number }): Promise<void> {
  if (!deliveryBoyId) return;
  const userRef = doc(db, 'users', deliveryBoyId);
  try {
    await updateDoc(userRef, {
      latitude: location.latitude,
      longitude: location.longitude,
    });
  } catch (error) {
    // It's often okay to silently fail here, as this can be called very frequently.
    // Logging is fine, but we don't want to show an error to the user for every failed update.
    console.error("Failed to update delivery boy location:", error);
  }
}
