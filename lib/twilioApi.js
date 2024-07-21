import API_BASE_URL from "./constants/baseUrl";

const sendSmsVerification = async (phoneNumber) => {
  try {
    const data = JSON.stringify({
      phone: phoneNumber,
    });

    const response = await fetch(`${API_BASE_URL}/v1/hms/account/otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: data,
    });

    let json = await response.json();
    return json.success;
  } catch (error) {
    console.error("sendSmsVerification", error);
    return false;
  }
};

const checkVerification = async (phoneNumber, code) => {
  try {
    const data = JSON.stringify({
      phone: phoneNumber,
      otp: code,
    });

    const response = await fetch(`${API_BASE_URL}/v1/hms/account/verifyotp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: data,
    });

    let json = await response.json();
    return json;
  } catch (error) {
    console.error("checkVerification", error);
    return false;
  }
};

export { sendSmsVerification, checkVerification };
