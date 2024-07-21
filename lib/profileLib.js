import API_BASE_URL from "./constants/baseUrl";

//load profiles based on gender
const listProfiles = async (authState) => {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/account/list`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authState.userToken}`,
      },
    });

    const json = await response.json();
    return json.success;
  } catch (error) {
    console.error("list profiles method", error);
    return false;
  }
};

const viewProfile = async (phoneNumber, authState) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/v1/account/phone/${phoneNumber}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authState.userToken}`,
        },
      }
    );

    const json = await response.json();
    return json.success;
  } catch (error) {
    console.error("view profile method ", error);
    return false;
  }
};

const loadProfileByPhoneNumber = async (phoneNumber, authState) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/v1/account/phone/${phoneNumber}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authState.userToken}`,
        },
      }
    );

    const json = await response.json();
    return json.success;
  } catch (error) {
    console.error("loadProfileByPhoneNumber", error);
    return false;
  }
};

const updateProfile = async (user, authState) => {
  try {
    const data = JSON.stringify(user);

    const response = await fetch(`${API_BASE_URL}/v1/hms/account/${user.id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authState.userToken}`,
      },
      body: data,
    });

    const json = await response.json();
    return json.success;
  } catch (error) {
    console.error("updateProfile", error);
    return false;
  }
};

const searchProfile = async (user, authState) => {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/account/search/nairobi`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authState.userToken}`,
      },
    });

    const json = await response.json();
    return json.success;
  } catch (error) {
    console.error("searchProfile", error);
    return false;
  }
};

export {
  listProfiles,
  viewProfile,
  loadProfileByPhoneNumber,
  updateProfile,
  searchProfile,
};
