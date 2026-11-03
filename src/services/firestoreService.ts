import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { Conversation, ChatMessage, UserPreferences, UserProfile } from '../types';

/**
 * Save or update user profile and preferences in Firestore
 */
export async function syncUserProfileToFirestore(
  profile: UserProfile,
  preferences: UserPreferences
): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) return;

  const path = `users/${currentUser.uid}`;
  try {
    await setDoc(
      doc(db, 'users', currentUser.uid),
      {
        uid: currentUser.uid,
        name: profile.name,
        email: currentUser.email || '',
        avatarSeed: profile.avatarSeed || profile.name.slice(0, 2).toUpperCase(),
        updatedAt: new Date().toISOString(),
        createdAt: new Date(profile.joinedAt).toISOString(),
        preferences,
      },
      { merge: true }
    );
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.WRITE, path);
    } catch {
      // Error logged cleanly
    }
  }
}

/**
 * Ensure conversation IDs are uniquely scoped per user to prevent cross-account collisions
 */
export function getUserScopedConversationId(id: string, uid: string): string {
  const cleanUid = uid.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);
  if (id.includes(cleanUid)) {
    return id;
  }
  return `c_${cleanUid}_${id.replace(/[^a-zA-Z0-9_\-]/g, '')}`;
}

/**
 * Save or update a conversation in Firestore
 */
export async function syncConversationToFirestore(conversation: Conversation): Promise<string> {
  const currentUser = auth.currentUser;
  if (!currentUser) return conversation.id;

  const targetId = getUserScopedConversationId(conversation.id, currentUser.uid);
  const path = `users/${currentUser.uid}/conversations/${targetId}`;
  try {
    await setDoc(
      doc(db, 'users', currentUser.uid, 'conversations', targetId),
      {
        id: targetId,
        userId: currentUser.uid,
        title: conversation.title,
        preview: conversation.preview,
        isPinned: conversation.isPinned ?? false,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      },
      { merge: true }
    );

    // Sync latest messages for this conversation
    if (conversation.messages.length > 0) {
      const batch = writeBatch(db);
      for (const msg of conversation.messages) {
        const msgRef = doc(db, 'users', currentUser.uid, 'conversations', targetId, 'messages', msg.id);
        batch.set(
          msgRef,
          {
            id: msg.id,
            conversationId: targetId,
            userId: currentUser.uid,
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp,
            model: msg.model || 'Crema Flash',
            createdAt: Date.now(),
          },
          { merge: true }
        );
      }
      await batch.commit();
    }
    return targetId;
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.WRITE, path);
    } catch {
      // Error logged cleanly
    }
    return targetId;
  }
}

/**
 * Delete a conversation and its messages from Firestore
 */
export async function deleteConversationFromFirestore(conversationId: string): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) return;

  const targetId = getUserScopedConversationId(conversationId, currentUser.uid);
  const path = `users/${currentUser.uid}/conversations/${targetId}`;
  try {
    // Delete subcollection messages first
    const messagesSnapshot = await getDocs(
      collection(db, 'users', currentUser.uid, 'conversations', targetId, 'messages')
    );
    const batch = writeBatch(db);
    messagesSnapshot.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });
    batch.delete(doc(db, 'users', currentUser.uid, 'conversations', targetId));
    await batch.commit();
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.DELETE, path);
    } catch {
      // Error logged cleanly
    }
  }
}

/**
 * Real-time listener for current user's conversations
 */
export function subscribeToUserConversations(
  onUpdate: (conversations: Conversation[]) => void
): () => void {
  const currentUser = auth.currentUser;
  if (!currentUser) return () => {};

  const path = `users/${currentUser.uid}/conversations`;
  const q = collection(db, 'users', currentUser.uid, 'conversations');

  let activeVersion = 0;

  const unsubscribe = onSnapshot(
    q,
    async (snapshot) => {
      const version = ++activeVersion;

      try {
        const convPromises = snapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();

          // Fetch messages for each conversation in parallel
          const msgsSnap = await getDocs(
            collection(db, 'users', currentUser.uid, 'conversations', docSnap.id, 'messages')
          );
          const messages: ChatMessage[] = [];
          msgsSnap.forEach((mSnap) => {
            const mData = mSnap.data();
            messages.push({
              id: mData.id,
              role: mData.role,
              content: mData.content,
              timestamp: mData.timestamp,
              model: mData.model,
            });
          });

          // Sort messages chronologically by embedded numeric timestamp
          const getTimeFromId = (m: ChatMessage) => {
            const num = parseInt(m.id.replace(/\D/g, ''), 10);
            return isNaN(num) ? 0 : num;
          };
          messages.sort((a, b) => getTimeFromId(a) - getTimeFromId(b));

          return {
            id: data.id,
            title: data.title,
            preview: data.preview,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            isPinned: data.isPinned ?? false,
            messages,
          } as Conversation;
        });

        const convList = await Promise.all(convPromises);

        // Discard stale async resolution if a newer snapshot arrived
        if (version !== activeVersion) return;

        // Sort by updatedAt descending
        convList.sort((a, b) => b.updatedAt - a.updatedAt);
        onUpdate(convList);
      } catch (err) {
        console.error('Error hydrating conversations snapshot:', err);
      }
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch {
        // Error logged cleanly
      }
    }
  );

  return unsubscribe;
}
