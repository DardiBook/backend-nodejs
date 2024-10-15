const admin = require("firebase-admin");
const { CloudTasksClient } = require("@google-cloud/tasks");

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECTID,
    privateKey: process.env.FIREBASE_PRIVATEKEY.replace(/\\n/gm, "\n"),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  }),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});

// Initialize Cloud Tasks
const client = new CloudTasksClient({
  credentials: {
    private_key: process.env.CLOUD_PRIVATEKEY.replace(/\\n/gm, "\n"),
    client_email: process.env.CLOUD_CLIENT_EMAIL,
  },
});

module.exports = { admin, client };
