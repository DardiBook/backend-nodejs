// server/api/create-subscription.js (example using Express)
const express = require("express");
const Razorpay = require("razorpay");
const ServerlessHttp = require("serverless-http")
const app = express();
const crypto = require("crypto");
const port = 3000;
const cors = require("cors");
const { Client } = require("@opensearch-project/opensearch");

require("dotenv").config();
// const router = express.Router();
app.use(express.json());

app.use(cors({
  origin: ['*','https://dardibook.in/','https://dashboard.dardibook.in/*'],
  credentials: true
}));
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
})
const client = new Client({
  node: process.env.SEARCH_URL,
  auth: {
    username: process.env.AWS_SEARCH_USERNAME,
    password: process.env.AWS_SEARCH_PASSWORD
  },
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});


const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

app.get("/", (req, res) => {
  try{
  console.log("site is live")
  res.json({ message: "Hello from express" });
  }catch(error){
  res.json({ error });
  }
});

app.post("/create-subscription", async (req, res) => {
  const { planId,total_count,customer_notify } = req.body;
  console.log(planId);
  console.log("req body : ", req.body);
  try {
    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      total_count: total_count, // number of billing cycles
      customer_notify: customer_notify,
      // start_at: Math.floor(Date.now() / 1000) + 60, // subscription start time
    });
    res.json(subscription);
  } catch (error) {
    res.status(500).send(error);
  }
});

app.get("/allPlans", async (req, res) => {
  try {
    const plans = await razorpay.plans.all();
    res.json(plans);
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

app.post("/getPlansById", async(req, res) => {
  const {id} = req.body;
  try {
      const planDetail = await razorpay.plans.fetch(id)
      res.json(planDetail)
  } catch (error) {
    res.status(500).send(error);
  }
});

app.get('/searchMedicine', async (req, res) => {
  const { q } = req.query;
  try {
    const { body } = await client.search({
      index: 'medicines',
      body: {
        query: {
          match_phrase_prefix: { name: q }
        }
      }
    });
    res.send(body.hits.hits.map(hit => hit._source));
  } catch (error) {
    console.error('Elasticsearch error:', error);
    res.status(500).json({ error: error.meta.body });
  }
});

// app.use('/.netlify/functions/server', router);

const handler = ServerlessHttp(app);

module.exports.handler = async(event, context) => {
    const result = await handler(event, context);
    return result;
}



// app.listen(port, () => {
//   console.log(`Server is running on http://localhost:${port}`);
// });

// module.exports = router;
