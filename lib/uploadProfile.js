import API_BASE_URL from "./constants/baseUrl";

const updateProfile = async (
  id,
  firstName,
  imageURL,
  age,
  gender,
  phoneNumber,
  tags,
  authContext,
  authState,
  genderPreference
) => {
  try {
    const data = JSON.stringify({
      id: id,
      firstName: firstName,
      imageURL: imageURL,
      age: age,
      gender: gender,
      phoneNumber: phoneNumber,
      tagIds: tags,
      genderPreference,
    });

    const response = await fetch(`${API_BASE_URL}/v1/account/update`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authState.userToken}`,
      },
      body: data,
    });

    let json = await response.json();
    authContext.updateProfileComplete(true);
    return json;
  } catch (error) {
    console.error("updateProfile", error);
    return false;
  }
};

const searchProfiles = async ( age, authState) => {
  try {
    const data = JSON.stringify({
      age: age,
    });

    const response = await fetch(`${API_BASE_URL}/v1/account/search`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authState.userToken}`,
      },
      body: data,
    });

    return await response.json();
  } catch (error) {
    console.error("searchProfiles", error);
    return false;
  }
};

export { updateProfile, searchProfiles };
