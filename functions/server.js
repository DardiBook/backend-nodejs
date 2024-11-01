// server/api/create-subscription.js (example using Express)
const express = require("express");
const Razorpay = require("razorpay");
const { createTask } = require("../EnqueueTaskCreator");
const ServerlessHttp = require("serverless-http");
const { auth } = require("../firebaseAdmin.js");
const app = express();
const crypto = require("crypto");
const port = 3000;
const cors = require("cors");
require("dotenv").config();
// const router = express.Router();
// app.use(bodyParser.json());
app.use(express.json());
app.use(cors({ credentials: true, origin: true }));

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

app.get("/", (req, res) => {
  try {
    console.log("site is live");
    res.json({ message: "Hello from express" });
  } catch (error) {
    res.json({ error });
  }
});

app.post("/allPlans", async (req, res) => {
  try {
    const plans = await razorpay.plans.all();
    res.json(plans);
  } catch (error) {
    res.status(500).send(error);
  }
});

app.post("/create-subscription", async (req, res) => {
  const { planId, total_count, customer_notify } = req.body;
  console.log(planId);
  console.log("req body : ", req.body);
  try {
    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      total_count: total_count, // number of billing cycles
      customer_notify: customer_notify,
    });
    res.json(subscription);
  } catch (error) {
    res.status(500).send(error);
  }
});

app.post("/getSubDetails", async (req, res) => {
  const { id } = req.body;
  try {
    const subDetail = await razorpay.subscriptions.fetch(id);
    res.json(subDetail);
  } catch (error) {
    res.status(500).send(error);
  }
});

app.post("/verification/", async (req, res) => {
  try {
    const crypt = crypto.createHmac("sha256", razorpay.key_secret);
    crypt.update(req.body.razorpay_payment_id + "|" + req.body.sid);
    const digest = crypt.digest("hex");
    if (digest === req.body.razorpay_signature) {
      res.json({ status: "success" });
    } else {
      res.json({ status: "fail" });
    }
  } catch (error) {
    res.status(500).json({ error: error });
  }
});

app.post("/getPlansById", async (req, res) => {
  const { id } = req.body;
  try {
    const planDetail = await razorpay.plans.fetch(id);
    res.json(planDetail);
  } catch (error) {
    res.status(500).send(error);
  }
});

// ================================== task functions and routes

// Route to handle the "Send Prescription" request
app.post("/queuePrescription", async (req, res) => {
  const { patientPhoneNumber, prescriptionLink } = req.body;

  try {
    // Call createTask to enqueue the task
    await createTask(patientPhoneNumber, prescriptionLink);
    res.status(200).send("Prescription task queued successfully!");
  } catch (error) {
    console.error("Error in enqueueing task:", error);
    res.status(500).send("Failed to enqueue task");
  }
});

app.post("/sendPrescription", async (req, res) => {
  const { patientPhoneNumber, prescriptionLink } = req.body;

  try {
    console.log(patientPhoneNumber, prescriptionLink); // Send the SMS
    res.status(200).send("Prescription sent!");
  } catch (error) {
    console.error("Error sending prescription:", error);
    res.status(500).send("Failed to send prescription");
  }
});

// ===================================

app.post("/get-uid", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    const userRecord = await auth.getUserByEmail(email);
    res.json({ uid: userRecord.uid });
  } catch (error) {
    if (error.code === "auth/user-not-found") {
      res.status(404).json({ error: "User not found" });
    } else {
      res.status(500).json({ error: "Failed to retrieve UID" });
    }
  }
});

const handler = ServerlessHttp(app);

module.exports.handler = async (event, context) => {
  const result = await handler(event, context);
  return result;
};
