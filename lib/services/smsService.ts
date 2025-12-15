"use server";

interface SendSMSParams {
  phoneNumber: string;
  message: string;
}

interface SMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send an SMS message using the configured SMS provider
 * The message format is optimized for phone AI recognition of OTP codes
 */
export async function sendSMS({
  phoneNumber,
  message,
}: SendSMSParams): Promise<SMSResponse> {
  const url = process.env.SMS_API_URL;

  if (!url) {
    console.error("SMS_API_URL is missing from environment variables");
    return { success: false, error: "SMS service not configured" };
  }

  if (
    !process.env.SMS_USER_ID ||
    !process.env.SMS_PASSWORD ||
    !process.env.SMS_API_KEY ||
    !process.env.SMS_SENDER_ID
  ) {
    console.error("SMS credentials are missing from environment variables");
    return { success: false, error: "SMS credentials not configured" };
  }

  // Clean phone number - ensure it starts with country code
  const cleanedPhoneNumber = phoneNumber.replaceAll(/[^0-9+]/g, "");
  let formattedPhone: string;
  if (cleanedPhoneNumber.startsWith("+")) {
    formattedPhone = cleanedPhoneNumber.substring(1);
  } else if (cleanedPhoneNumber.startsWith("0")) {
    formattedPhone = `254${cleanedPhoneNumber.substring(1)}`;
  } else {
    formattedPhone = cleanedPhoneNumber;
  }

  const payload = new URLSearchParams({
    userid: process.env.SMS_USER_ID,
    password: process.env.SMS_PASSWORD,
    senderid: process.env.SMS_SENDER_ID,
    mobile: formattedPhone,
    msg: message,
    msgType: "text",
    duplicatecheck: "true",
    output: "json",
    sendMethod: "quick",
  });

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

    if (result.status === "success" || response.ok) {
      return {
        success: true,
        messageId: result.msgid || result.messageId,
      };
    }

    return {
      success: false,
      error: result.message || "Failed to send SMS",
    };
  } catch (error) {
    console.error("Failed to send SMS:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send SMS",
    };
  }
}

/**
 * Format a 2FA OTP message that phone AI can easily recognize
 * The format follows best practices for auto-fill recognition
 */
function format2FAMessage(otp: string, appName: string = "UMS POS"): string {
  // Format optimized for phone AI recognition:
  // - Clear identification of the code
  // - Code on its own line for easy parsing
  // - Standard format that iOS/Android can detect
  return `${appName} Security Code

Your verification code is: ${otp}

This code expires in 5 minutes. Do not share this code with anyone.

@umskenya.com #${otp}`;
}

/**
 * Send a 2FA OTP via SMS
 */
export async function send2FAOTP(
  phoneNumber: string,
  otp: string
): Promise<SMSResponse> {
  const message = format2FAMessage(otp);
  return sendSMS({ phoneNumber, message });
}
