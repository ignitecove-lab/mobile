import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Dimensions,
  Platform,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import React, {
  useLayoutEffect,
  useState,
  useEffect,
  useCallback,
} from "react";
import useAuth from "../useAuth";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import { updateProfile } from "../lib/uploadProfile";
import API_BASE_URL from "../lib/constants/baseUrl";
import { Ionicons } from "@expo/vector-icons";
import Modal from "react-native-modal";
import tw from "tailwind-rn";
const IMAGE_URL = "https://image.ignitecove.com";

const ModalScreen = () => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [firstName, setFirstName] = useState("");
  const [location, setLocation] = useState("");
  const [gender, setGender] = useState("");
  const [genderPreference, setGenderPreference] = useState("");
  const [PreferenceDisiabled, setPreferenceDisabled] = useState(true);
  const [genderPreferenceDis, setGenderPreferenceDis] = useState(true);
  const [permission, requestPermission] = ImagePicker.useCameraPermissions();
  const { user, authState, authContext } = useAuth();
  const navigation = useNavigation();
  const [image, setImage] = useState(null);
  const [age, setAge] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [tags, setTags] = useState(null);

  const deviceWidth = Dimensions.get("window").width;
  const deviceHeight =
    Platform.OS === "ios"
      ? Dimensions.get("window").height
      : require("react-native-extra-dimensions-android").get(
          "REAL_WINDOW_HEIGHT"
        );

  const incompleteForm =
    !firstName ||
    !image ||
    !location ||
    !gender ||
    !age ||
    !genderPreference ||
    genderPreferenceDis ||
    selectedTags.length < 1;

  const fetchTags = useCallback(async () => {
    await fetch(`${API_BASE_URL}/v1/account/tags`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + authState.userToken,
      },
    })
      .then(async (response) => {
        if (response.ok) {
          return response.json();
        }
        const text = await response.json();
        throw new Error(text.message);
      })
      .then((data) => {
        setTags(data);
      })
      .catch((err) => {
        console.log("fetchTags error", err);
      });
  }, []);

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(
        selectedTags.filter((selectedTag) => selectedTag !== tag)
      );
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const pickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        const { uri } = result.assets[0];
        const fileSize = await getFileSize(uri);
        const fileName = uri.split("/").pop();

        if (fileSize.size > 2.3 * 1024 * 1024) {
          Alert.alert(
            "File too large",
            "Please select an image smaller than 2MB."
          );
          return;
        }

        const formData = new FormData();
        formData.append("file", {
          uri: uri,
          type: fileSize.type,
          name: fileName,
        });

        const response = await fetch(`${IMAGE_URL}/api/v1/image/upload`, {
          method: "POST",
          body: formData,
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${authState.userToken}`,
          },
        });

        if (response.ok) {
          const resp = await response.json();
          let imageUrl = resp.imageUrl;
          if (imageUrl?.startsWith("http://")) {
            imageUrl = imageUrl?.replace("http://", "https://");
          }
          setImage(imageUrl);
        } else {
          throw new Error(
            `Network response was not ok: ${response.statusText}`
          );
        }
      }
    } catch (error) {
      console.log("upload error", error);
      Alert.alert("Upload failed", "Please try again later.");
    }
  };

  const getFileSize = async (uri) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    return blob;
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: "Update Profile",
      headerStyle: {
        backgroundColor: "white",
      },
      headerTitleStyle: { color: "black" },
    });
  }, []);

  const fetchUser = useCallback(async () => {
    if (!user?.id) {
      return;
    }
    await fetch(`${API_BASE_URL}/v1/account/get/${user?.id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + authState.userToken,
      },
    })
      .then(async (response) => {
        if (response.ok) {
          return response.json();
        }
        const text = await response.json();
        throw new Error(text.message);
      })
      .then((data) => {
        setFirstName(data.firstName);
        setImage(data.imageURL);
        setLocation(data.location);
        setAge(data.age);
        setGender(data.gender);
        setSelectedTags(data?.accountTags.map((tag) => tag.tagId));
        setGenderPreference(data?.genderPreference);
        setGenderPreferenceDis(data?.genderPreference ? false : true);
        setPreferenceDisabled(data?.genderPreference ? false : true);
      })
      .catch((err) => {
        console.log("fetchUser error", err);
      });
  }, []);

  const handlePreferenceChange = (itemValue) => {
    setGenderPreference(itemValue);
    setModalVisible(true);
  };

  useEffect(() => {
    fetchTags();
    fetchUser();
  }, [fetchTags, fetchUser]);

  return (
    <View style={styles.container}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View style={styles.contentContainer}>
          <Text style={styles.stepText}>Display Name</Text>
          <TextInput
            value={firstName}
            onChangeText={setFirstName}
            style={styles.input}
            placeholder="Username"
          />

          <Text style={styles.stepText}>Upload Profile Image</Text>

          {/* image container */}
          {image ? (
            <View style={styles.imageContainer1}>
              <Image
                source={{ uri: image || user?.imageURL }}
                style={styles.image}
              />

              <TouchableOpacity
                style={styles.editIconContainer}
                onPress={pickImage}
              >
                <Ionicons name="pencil" size={24} color="#000" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={pickImage}>
              <View style={styles.imageContainer}>
                <Text style={styles.imageContainerText}>
                  Click here to select your image from the gallery
                </Text>
              </View>
            </TouchableOpacity>
          )}

          {/* image upload progress bar */}
          {uploadProgress > 0 && uploadProgress < 100 && (
            <View style={styles.progressBarContainer}>
              <View
                style={[styles.progressBar, { width: `${uploadProgress}%` }]}
              />
            </View>
          )}

          <Text style={styles.stepText}>Location</Text>
          <GooglePlacesAutocomplete
            placeholder="Search location"
            fetchDetails={true}
            onPress={(data, details = null) => {
              console.log(data.description);
              setLocation(data.description);
            }}
            query={{
              key: "AIzaSyBy61yd9aWrx4XhVvsujA_4aSA_sDINB_s",
              language: "en",
            }}
          />
          <Text style={styles.input}>{location}</Text>

          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              justifyContent: "space-between",
              marginBottom: 20,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.stepText}>Gender</Text>
              <View
                style={{
                  borderRadius: 10,
                  overflow: "hidden",
                  width: 180,
                  height: 50,
                }}
              >
                <Picker
                  style={{
                    borderWidth: 1,
                    borderRadius: 10,
                    backgroundColor: "#e4e4e7",
                    width: 180,
                    height: 50,
                  }}
                  selectedValue={gender}
                  onValueChange={(itemValue, itemIndex) => setGender(itemValue)}
                >
                  <Picker.Item label="Select Gender" value="" />
                  <Picker.Item
                    label="Male"
                    value="Male"
                    style={{ color: "#000000" }}
                  />
                  <Picker.Item
                    label="Female"
                    value="Female"
                    style={{ color: "000000" }}
                  />
                </Picker>
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepText}>Only Show Me</Text>
              <View
                style={{
                  borderRadius: 10,
                  overflow: "hidden",
                  width: 180,
                  height: 50,
                  marginLeft: 10,
                }}
              >
                <Picker
                  style={{
                    borderWidth: 1,
                    borderRadius: 10,
                    backgroundColor: "#e4e4e7",
                    width: 180,
                    height: 50,
                  }}
                  selectedValue={genderPreference}
                  onValueChange={handlePreferenceChange}
                  enabled={PreferenceDisiabled}
                >
                  <Picker.Item label="Gender Preference" value="" />
                  <Picker.Item
                    label="Men"
                    value="Male"
                    style={{ color: "#000000" }}
                  />
                  <Picker.Item
                    label="Women"
                    value="Female"
                    style={{ color: "000000" }}
                  />
                </Picker>
              </View>
              {genderPreferenceDis && (
                <Text style={styles.prefError}>
                  You need to confirm your preference selection by pressing
                  'Proceed'
                </Text>
              )}
            </View>

            {/* Modal for confirmation */}
            <Modal
              style={styles.modalContainer}
              isVisible={modalVisible}
              animationType="slide"
              hasBackdrop={true}
              deviceWidth={deviceWidth}
              deviceHeight={deviceHeight}
              backdropColor={"#00000031"}
            >
              <View style={styles.modalBody}>
                <Text style={styles.modalTextHeader}>Gender Preference</Text>

                <Text style={styles.modalText}>
                  Confirm that you want to choose "{genderPreference}" as your
                  gender preference. This means you will only be able to see
                  profiles of "{genderPreference}" gender with the same
                  interests.
                </Text>

                <Text style={styles.disclaimerText}>
                  Once saved, this preference cannot be changed.
                </Text>

                <View style={tw("flex-row justify-center items-center")}>
                  <TouchableOpacity
                    onPress={() => {
                      setModalVisible(false);
                    }}
                    style={tw(
                      "bg-indigo-600 mr-6 ml-6 w-1/3 items-center rounded-md mt-6"
                    )}
                  >
                    <Text
                      onPress={() => {
                        setModalVisible(false);
                        setGenderPreferenceDis(true);
                      }}
                      style={tw("text-white py-2 px-2  font-medium")}
                    >
                      Cancel
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      setModalVisible(false);
                      setGenderPreferenceDis(false);
                    }}
                    style={tw(
                      "bg-red-500 mr-6 ml-6 w-1/3 items-center rounded-md mt-6"
                    )}
                  >
                    <Text style={tw("text-white py-2 px-2 font-medium")}>
                      Proceed
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          </View>

          <Text style={styles.stepText}>Age</Text>
          <TextInput
            value={age?.toString()}
            onChangeText={(input) => setAge(input)}
            style={styles.input}
            keyboardType="numeric"
            maxLength={2}
            placeholder="Age"
          />

          <Text style={styles.stepText}>Select 5 Tag Traits</Text>

          <View style={styles.tagsContainer}>
            {tags &&
              tags?.map((tag) => (
                <TouchableOpacity
                  key={tag.id}
                  style={[
                    styles.tag,
                    selectedTags.includes(tag.id) && styles.selectedTag,
                  ]}
                  onPress={() => toggleTag(tag.id)}
                >
                  <Text style={styles.tagText}>{tag.tag}</Text>
                </TouchableOpacity>
              ))}
          </View>
        </View>
      </ScrollView>
      <View style={styles.header}>
        <TouchableOpacity
          disabled={incompleteForm}
          style={[styles.updateButton, incompleteForm && styles.disabledButton]}
          onPress={() => {
            if (!incompleteForm) {
              if (age < 18) {
                alert("You MUST be 18 years or older to use this app");
                return;
              }

              updateProfile(
                user.id,
                firstName,
                image,
                location,
                age,
                gender,
                user.phoneNumber,
                selectedTags,
                authContext,
                authState,
                genderPreference
              ).then(() => {
                navigation.navigate("Home");
              });
            }
          }}
        >
          <Text style={styles.buttonText}>Update Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  modalContainer: {
    flex: 1,
    alignItems: "center",
  },
  modalBody: {
    flex: 1,
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 10,
    maxHeight: "35%",
    width: "98%",
  },
  modalTextHeader: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 10,
    padding: 5,
  },
  disclaimerText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  logo: {
    height: 100,
    width: "100%",
  },
  headerText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "gray",
  },
  stepText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "grey",
    marginTop: 12,
    marginLeft: 10,
  },
  prefError: {
    fontSize: 13,
    fontWeight: "bold",
    color: "red",
    marginTop: 12,
    marginLeft: 10,
  },
  input: {
    fontSize: 16,
    borderWidth: 1,
    borderColor: "black",
    borderRadius: 8,
    padding: 10,
    marginTop: 6,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
  },
  tag: {
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    margin: 8,
  },
  selectedTag: {
    backgroundColor: "#bae6fd",
    borderColor: "#bae6fd",
  },
  tagText: {
    color: "#000000",
  },
  updateButton: {
    backgroundColor: "#ef4444",
    borderRadius: 8,
    padding: 8,
    marginTop: 16,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "gray",
    borderRadius: 8,
    padding: 10,
    marginTop: 20,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    paddingHorizontal: 64,
    paddingVertical: 4,
    fontSize: 16,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: "white",
  },
  imageContainer: {
    marginTop: 15,
    marginBottom: 16,
    elevation: 2,
    width: "50%",
    height: 200,
    borderRadius: 2,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#105",
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    padding: 5,
  },
  imageContainer1: {
    marginTop: 15,
    marginBottom: 16,
    elevation: 2,
    width: "50%",
    height: 200,
    borderRadius: 2,
    justifyContent: "center",
  },
  imageContainerText: {
    textAlign: "center",
    padding: 5,
  },
  image: {
    width: "100%",
    height: 200,
    borderRadius: 2,
    objectFit: "cover",
  },
  progressBarContainer: {
    width: "50%",
    height: 10,
    backgroundColor: "#e0e0e0",
    borderRadius: 5,
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#76c7c0",
    borderRadius: 5,
  },
  editIconContainer: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 6,
  },
});

export default ModalScreen;
