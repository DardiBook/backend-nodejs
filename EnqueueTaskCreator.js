const { client } = require("./firebaseAdmin");

async function createTask(patientPhoneNumber, prescriptionLink) {
  const queuePath = client.queuePath(
    "dardibook",
    "asia-south1",
    "DardiBookPrescriptionQueue"
  );

  const task = {
    httpRequest: {
      httpMethod: "POST",
      url: "https://backend.dardibook.in/sendPrescription",
      headers: { "Content-Type": "application/json" },
      body: Buffer.from(
        JSON.stringify({ patientPhoneNumber, prescriptionLink })
      ).toString("base64"),
    },
  };

  const currentTime = new Date();
  task.scheduleTime = {
    seconds: currentTime.getTime() / 1000 + 120, // 2 minutes delay
  };

  const [response] = await client.createTask({ parent: queuePath, task });
  console.log("Task created:", response.name);
}

module.exports = { createTask };
