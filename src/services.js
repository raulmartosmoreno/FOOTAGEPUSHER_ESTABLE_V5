import { db } from "./firebase";
import { doc, getDoc, setDoc, updateDoc, increment, collection, addDoc, onSnapshot, query, orderBy } from "firebase/firestore";

const VIDEOS_COLLECTION = "videos";

// Limpieza de IDs para que no fallen en Firebase
const sanitizeId = (id) => {
  if (!id) return "unknown";
  return id.replace(/\//g, "_").replace(/\./g, "_");
};

export const getOrInitVideoStats = async (rawId) => {
  const videoId = sanitizeId(rawId);
  const docRef = doc(db, VIDEOS_COLLECTION, videoId);
  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) return docSnap.data();
    else {
      const initial = { likes: 0, views: 1, commentsCount: 0 };
      await setDoc(docRef, initial, { merge: true });
      return initial;
    }
  } catch (e) { console.error(e); return null; }
};

export const incrementView = async (rawId) => {
  const videoId = sanitizeId(rawId);
  const docRef = doc(db, VIDEOS_COLLECTION, videoId);
  try { await setDoc(docRef, { views: increment(1) }, { merge: true }); } catch (e) {}
};

// DAR LIKE (+1)
export const addLike = async (rawId) => {
  const videoId = sanitizeId(rawId);
  const docRef = doc(db, VIDEOS_COLLECTION, videoId);
  try { await updateDoc(docRef, { likes: increment(1) }); } catch (e) {}
};

// QUITAR LIKE (-1)
export const removeLike = async (rawId) => {
  const videoId = sanitizeId(rawId);
  const docRef = doc(db, VIDEOS_COLLECTION, videoId);
  try { await updateDoc(docRef, { likes: increment(-1) }); } catch (e) {}
};

export const addComment = async (rawId, user, text, generatedName) => {
  const videoId = sanitizeId(rawId);
  const videoRef = doc(db, VIDEOS_COLLECTION, videoId);
  const commentsRef = collection(videoRef, "comments");
  try {
    await addDoc(commentsRef, {
      text: text,
      username: generatedName,
      uid: user.uid,
      photoURL: user.photoURL || null,
      createdAt: new Date()
    });
    await updateDoc(videoRef, { commentsCount: increment(1) });
  } catch (e) { console.error(e); }
};

export const subscribeToComments = (rawId, callback) => {
  const videoId = sanitizeId(rawId);
  const videoRef = doc(db, VIDEOS_COLLECTION, videoId);
  const commentsRef = collection(videoRef, "comments");
  const q = query(commentsRef, orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const comments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(comments);
  });
};

export const subscribeToVideoStats = (rawId, callback) => {
  const videoId = sanitizeId(rawId);
  const docRef = doc(db, VIDEOS_COLLECTION, videoId);
  return onSnapshot(docRef, (doc) => {
    if (doc.exists()) callback(doc.data());
  });
};