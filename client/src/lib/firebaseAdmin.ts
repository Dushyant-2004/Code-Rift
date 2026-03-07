import admin from "firebase-admin";

function isPlaceholder(val: string | undefined): boolean {
  if (!val) return true;
  return val.startsWith("your_") || val === "";
}

function getFirebaseAdmin() {
  if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (isPlaceholder(projectId) || isPlaceholder(clientEmail) || isPlaceholder(privateKey)) {
      throw new Error(
        "Firebase Admin credentials not configured. " +
        "Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in .env.local. " +
        "Get these from Firebase Console → Project Settings → Service Accounts → Generate New Private Key."
      );
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: projectId!,
        clientEmail: clientEmail!,
        privateKey: privateKey!.replace(/\\n/g, "\n"),
      }),
    });
  }
  return admin;
}

export default getFirebaseAdmin;
