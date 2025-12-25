/**
 * Family Request Service
 * Handles family invitation requests and user lookups
 */

import {
  ref,
  push,
  set,
  get,
  update,
  query,
  orderByChild,
  equalTo,
  onValue,
  off,
  DataSnapshot,
} from "firebase/database";
import { database } from "../config/firebase";
import { FamilyRequest, Family, FamilyMemberRole } from "../types";
import {
  createFamilyRequestNotification,
  createRequestAcceptedNotification,
  createRequestDeclinedNotification,
  createMemberLeftNotification,
} from "./notificationService";

const FAMILY_REQUESTS_PATH = "familyRequests";
const FAMILIES_PATH = "families";
const USERS_PATH = "users";

const REQUEST_EXPIRY_DAYS = 7;

/**
 * Check if a user exists by email
 */
export const checkUserExistsByEmail = async (
  email: string
): Promise<{ exists: boolean; userId?: string; displayName?: string }> => {
  try {
    const usersRef = ref(database, USERS_PATH);
    const snapshot = await get(usersRef);

    if (!snapshot.exists()) {
      return { exists: false };
    }

    let foundUser: { userId: string; displayName?: string } | null = null;

    snapshot.forEach((childSnapshot: DataSnapshot) => {
      if (foundUser) return; // Skip if already found

      const userData = childSnapshot.val();
      if (userData.email?.toLowerCase() === email.toLowerCase()) {
        foundUser = {
          userId: childSnapshot.key!,
          displayName: userData.displayName,
        };
      }
    });

    if (foundUser !== null) {
      const user: { userId: string; displayName: string } = foundUser;
      return {
        exists: true,
        userId: user.userId,
        displayName: user.displayName,
      };
    }

    return { exists: false };
  } catch (error) {
    console.error("Error checking user existence:", error);
    return { exists: false };
  }
};

/**
 * Get or create family for a user
 */
export const getOrCreateFamily = async (
  userId: string,
  userEmail: string,
  displayName?: string
): Promise<string> => {
  // Check if user already has a family
  const userRef = ref(database, `${USERS_PATH}/${userId}`);
  const userSnapshot = await get(userRef);

  if (userSnapshot.exists()) {
    const userData = userSnapshot.val();
    if (userData.familyId) {
      return userData.familyId;
    }
  }

  // Create a new family
  const familiesRef = ref(database, FAMILIES_PATH);
  const newFamilyRef = push(familiesRef);
  const familyId = newFamilyRef.key!;

  const family: Family = {
    id: familyId,
    ownerId: userId,
    createdAt: Date.now(),
    members: {
      [userId]: {
        role: "owner",
        email: userEmail,
        displayName: displayName,
        joinedAt: Date.now(),
      },
    },
  };

  await set(newFamilyRef, family);

  // Update user's familyId
  await update(userRef, { familyId });

  return familyId;
};

/**
 * Send a family invitation request
 */
export const sendFamilyRequest = async (
  fromUserId: string,
  fromUserName: string,
  fromUserEmail: string,
  toEmail: string
): Promise<{ success: boolean; requestId?: string; error?: string }> => {
  try {
    // Validate email
    if (!toEmail || !toEmail.includes("@")) {
      return { success: false, error: "Invalid email address" };
    }

    // Don't allow sending request to self
    if (fromUserEmail.toLowerCase() === toEmail.toLowerCase()) {
      return { success: false, error: "Cannot send request to yourself" };
    }

    // Check if user exists
    const {
      exists,
      userId: toUserId,
      displayName,
    } = await checkUserExistsByEmail(toEmail);

    // Get or create family for sender
    const familyId = await getOrCreateFamily(
      fromUserId,
      fromUserEmail,
      fromUserName
    );

    // Check for existing pending request
    const existingRequest = await getPendingRequestByEmail(familyId, toEmail);
    if (existingRequest) {
      return { success: false, error: "Request already sent to this email" };
    }

    // Create the request
    const requestsRef = ref(database, FAMILY_REQUESTS_PATH);
    const newRequestRef = push(requestsRef);
    const requestId = newRequestRef.key!;

    const expiresAt = Date.now() + REQUEST_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

    // Build request object - only include toUserId if it exists
    const request: any = {
      id: requestId,
      fromUserId,
      fromUserName,
      fromUserEmail,
      toEmail,
      familyId,
      status: "pending",
      createdAt: Date.now(),
      expiresAt,
    };

    // Only add toUserId if user exists (Firebase rejects undefined values)
    if (toUserId) {
      request.toUserId = toUserId;
    }

    await set(newRequestRef, request);

    // If user exists, create notification
    if (exists && toUserId) {
      await createFamilyRequestNotification(toUserId, fromUserName, requestId);
    }
    // If user doesn't exist, you would send email here
    // For now, we'll just log it
    else {
      console.log(`Would send email to ${toEmail} from ${fromUserName}`);
      // TODO: Implement email sending via Firebase Functions or third-party service
    }

    return { success: true, requestId };
  } catch (error: any) {
    console.error("Error sending family request:", error);
    return { success: false, error: error.message || "Failed to send request" };
  }
};

/**
 * Get pending request by email and familyId
 */
const getPendingRequestByEmail = async (
  familyId: string,
  toEmail: string
): Promise<FamilyRequest | null> => {
  const requestsRef = ref(database, FAMILY_REQUESTS_PATH);
  const snapshot = await get(requestsRef);

  if (!snapshot.exists()) {
    return null;
  }

  let foundRequest: FamilyRequest | null = null;

  snapshot.forEach((childSnapshot: DataSnapshot) => {
    const request = childSnapshot.val() as FamilyRequest;
    if (
      request.familyId === familyId &&
      request.toEmail.toLowerCase() === toEmail.toLowerCase() &&
      request.status === "pending"
    ) {
      foundRequest = request;
      return true; // Stop iteration
    }
  });

  return foundRequest;
};

/**
 * Get pending requests for a user
 */
export const getPendingRequestsForUser = async (
  userEmail: string
): Promise<FamilyRequest[]> => {
  const requestsRef = ref(database, FAMILY_REQUESTS_PATH);
  const snapshot = await get(requestsRef);

  if (!snapshot.exists()) {
    return [];
  }

  const requests: FamilyRequest[] = [];

  snapshot.forEach((childSnapshot: DataSnapshot) => {
    const request = childSnapshot.val() as FamilyRequest;
    if (
      request.toEmail.toLowerCase() === userEmail.toLowerCase() &&
      request.status === "pending" &&
      request.expiresAt > Date.now()
    ) {
      requests.push(request);
    }
  });

  return requests.sort((a, b) => b.createdAt - a.createdAt);
};

/**
 * Get sent requests by a user
 */
export const getSentRequests = async (
  userId: string
): Promise<FamilyRequest[]> => {
  const requestsRef = ref(database, FAMILY_REQUESTS_PATH);
  const snapshot = await get(requestsRef);

  if (!snapshot.exists()) {
    return [];
  }

  const requests: FamilyRequest[] = [];

  snapshot.forEach((childSnapshot: DataSnapshot) => {
    const request = childSnapshot.val() as FamilyRequest;
    if (request.fromUserId === userId) {
      requests.push(request);
    }
  });

  return requests.sort((a, b) => b.createdAt - a.createdAt);
};

/**
 * Check if user can join a family (not already in one)
 */
export const canJoinFamily = async (userId: string): Promise<boolean> => {
  const userRef = ref(database, `${USERS_PATH}/${userId}`);
  const snapshot = await get(userRef);

  if (!snapshot.exists()) {
    return true; // New user can join
  }

  const userData = snapshot.val();
  return !userData.familyId; // Can join if no familyId
};

/**
 * Accept a family request
 */
export const acceptFamilyRequest = async (
  requestId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Get the request
    const requestRef = ref(database, `${FAMILY_REQUESTS_PATH}/${requestId}`);
    const requestSnapshot = await get(requestRef);

    if (!requestSnapshot.exists()) {
      return { success: false, error: "Request not found" };
    }

    const request = requestSnapshot.val() as FamilyRequest;

    // Validate request
    if (request.status !== "pending") {
      return { success: false, error: "Request is no longer pending" };
    }

    if (request.expiresAt < Date.now()) {
      await update(requestRef, { status: "expired" });
      return { success: false, error: "Request has expired" };
    }

    // Check if user can join family
    const canJoin = await canJoinFamily(userId);
    if (!canJoin) {
      return {
        success: false,
        error: "You must leave your current family first",
      };
    }

    // Get user info
    const userRef = ref(database, `${USERS_PATH}/${userId}`);
    const userSnapshot = await get(userRef);
    const userData = userSnapshot.exists() ? userSnapshot.val() : {};

    // Add user to family
    const familyRef = ref(database, `${FAMILIES_PATH}/${request.familyId}`);
    const familySnapshot = await get(familyRef);

    if (!familySnapshot.exists()) {
      return { success: false, error: "Family not found" };
    }

    const family = familySnapshot.val() as Family;

    // Update family members
    const updatedMembers = {
      ...family.members,
      [userId]: {
        role: "member",
        email: request.toEmail,
        displayName: userData.displayName || undefined,
        joinedAt: Date.now(),
      } as FamilyMemberRole,
    };

    await update(familyRef, { members: updatedMembers });

    // Update user's familyId
    await update(userRef, { familyId: request.familyId });

    // Update request status
    await update(requestRef, { status: "accepted" });

    // Notify the sender
    await createRequestAcceptedNotification(
      request.fromUserId,
      userData.displayName || request.toEmail
    );

    return { success: true };
  } catch (error: any) {
    console.error("Error accepting family request:", error);
    return {
      success: false,
      error: error.message || "Failed to accept request",
    };
  }
};

/**
 * Decline a family request
 */
export const declineFamilyRequest = async (
  requestId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const requestRef = ref(database, `${FAMILY_REQUESTS_PATH}/${requestId}`);
    const requestSnapshot = await get(requestRef);

    if (!requestSnapshot.exists()) {
      return { success: false, error: "Request not found" };
    }

    const request = requestSnapshot.val() as FamilyRequest;

    // Update request status
    await update(requestRef, { status: "declined" });

    // Notify the sender
    await createRequestDeclinedNotification(
      request.fromUserId,
      request.toEmail
    );

    return { success: true };
  } catch (error: any) {
    console.error("Error declining family request:", error);
    return {
      success: false,
      error: error.message || "Failed to decline request",
    };
  }
};

/**
 * Cancel a sent request (by sender)
 */
export const cancelSentRequest = async (
  requestId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const requestRef = ref(database, `${FAMILY_REQUESTS_PATH}/${requestId}`);
    const requestSnapshot = await get(requestRef);

    if (!requestSnapshot.exists()) {
      return { success: false, error: "Request not found" };
    }

    const request = requestSnapshot.val() as FamilyRequest;

    // Verify the user is the sender
    if (request.fromUserId !== userId) {
      return { success: false, error: "You can only cancel your own requests" };
    }

    // Only allow canceling pending requests
    if (request.status !== "pending") {
      return { success: false, error: "Can only cancel pending requests" };
    }

    // Update request status to cancelled
    await update(requestRef, { status: "cancelled" });

    return { success: true };
  } catch (error: any) {
    console.error("Error cancelling request:", error);
    return {
      success: false,
      error: error.message || "Failed to cancel request",
    };
  }
};

/**
 * Leave a family
 */
export const leaveFamily = async (
  userId: string,
  familyId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const familyRef = ref(database, `${FAMILIES_PATH}/${familyId}`);
    const familySnapshot = await get(familyRef);

    if (!familySnapshot.exists()) {
      return { success: false, error: "Family not found" };
    }

    const family = familySnapshot.val() as Family;

    // Check if user is owner
    if (family.ownerId === userId) {
      return {
        success: false,
        error:
          "Family owner cannot leave. Transfer ownership or delete family first.",
      };
    }

    // Get user info for notification
    const userRef = ref(database, `${USERS_PATH}/${userId}`);
    const userSnapshot = await get(userRef);
    const userData = userSnapshot.exists() ? userSnapshot.val() : {};

    // Remove user from family
    const updatedMembers = { ...family.members };
    delete updatedMembers[userId];

    await update(familyRef, { members: updatedMembers });

    // Remove familyId from user
    await update(userRef, { familyId: null });

    // Notify owner
    await createMemberLeftNotification(
      family.ownerId,
      userData.displayName || userData.email || "A member"
    );

    return { success: true };
  } catch (error: any) {
    console.error("Error leaving family:", error);
    return { success: false, error: error.message || "Failed to leave family" };
  }
};

/**
 * Get family by ID
 */
export const getFamilyById = async (
  familyId: string
): Promise<Family | null> => {
  const familyRef = ref(database, `${FAMILIES_PATH}/${familyId}`);
  const snapshot = await get(familyRef);

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.val() as Family;
};

/**
 * Get user's family
 */
export const getUserFamily = async (userId: string): Promise<Family | null> => {
  const userRef = ref(database, `${USERS_PATH}/${userId}`);
  const userSnapshot = await get(userRef);

  if (!userSnapshot.exists()) {
    return null;
  }

  const userData = userSnapshot.val();
  if (!userData.familyId) {
    return null;
  }

  return getFamilyById(userData.familyId);
};

/**
 * Subscribe to family requests for a user
 */
export const subscribeToFamilyRequests = (
  userEmail: string,
  callback: (requests: FamilyRequest[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const requestsRef = ref(database, FAMILY_REQUESTS_PATH);

  const listener = onValue(
    requestsRef,
    (snapshot: DataSnapshot) => {
      const requests: FamilyRequest[] = [];
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot: DataSnapshot) => {
          const request = childSnapshot.val() as FamilyRequest;
          if (
            request.toEmail.toLowerCase() === userEmail.toLowerCase() &&
            request.status === "pending" &&
            request.expiresAt > Date.now()
          ) {
            requests.push(request);
          }
        });
      }
      callback(requests.sort((a, b) => b.createdAt - a.createdAt));
    },
    (error) => {
      console.error("Family requests subscription error:", error);
      onError?.(error);
    }
  );

  return () => off(requestsRef, "value", listener);
};
