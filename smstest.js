// 1. Load environment variables from .env file
// You must have 'dotenv' installed (npm install dotenv) to run this command successfully
require("dotenv").config();

const sendSMS = async () => {
  // Retrieve the URL from the environment variables
  const url = process.env.SMS_API_URL;

  // Debug check to ensure the URL is being loaded
  console.log("Debug: Loaded URL:", url);

  if (!url) {
    console.error(
      "❌ Error: SMS_API_URL is missing or undefined in your .env file."
    );
    console.error(
      "Make sure you installed 'dotenv' and the variable is correctly set."
    );
    return;
  }

  // Check for other required credentials (good practice)
  if (
    !process.env.SMS_USER_ID ||
    !process.env.SMS_PASSWORD ||
    !process.env.SMS_API_KEY ||
    !process.env.SMS_SENDER_ID
  ) {
    console.error(
      "❌ Error: One or more required credentials (USER_ID, PASSWORD, API_KEY, SENDER_ID) are missing from .env."
    );
    return;
  }

  // Construct the form-urlencoded payload
  const payload = new URLSearchParams({
    userid: process.env.SMS_USER_ID,
    password: process.env.SMS_PASSWORD,
    senderid: process.env.SMS_SENDER_ID,
    mobile: "254725799783",
    msg: "POS 2FA Code: 123456",
    msgType: "text",
    duplicatecheck: "true",
    output: "json",
    sendMethod: "quick",
  });

  console.log("Attempting to send SMS to 254725799783...");

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        apikey: process.env.SMS_API_KEY,
        "cache-control": "no-cache",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: payload,
    });

    const result = await response.json();
    console.log("✅ SMS API Response (Success/Failure Status):", result);
  } catch (error) {
    // This catches connection errors (e.g., DNS issues, network down)
    console.error("❌ Failed to send SMS (Connection Error):", error);
  }
};

sendSMS();
