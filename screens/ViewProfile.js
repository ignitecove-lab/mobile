import React, { useState } from "react";
import {
  View,
  Text,
  Button,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/core";
import tw from "tailwind-rn";
import useAuth from "../useAuth";
import API_BASE_URL from "../lib/constants/baseUrl";
import Modal from "react-native-modal";

const ViewProfileScreen = ({ route }) => {
  const [isModalVisible, setModalVisible] = useState(false);
  const [modalText, setModalText] = useState("");
  const [subscription, setSubscription] = useState(false);
  const [modalLoading, setModalLoading] = useState(true);
  const [modalShowButton, setModalShowButton] = useState(false);
  const { user, authState } = useAuth();
  const navigation = useNavigation();
  const userData = route.params.userData; // Get the user data passed from the Home Screen
  const delay = (ms) => new Promise((res) => setTimeout(res, ms));

  const deviceWidth = Dimensions.get("window").width;
  const deviceHeight =
    Platform.OS === "ios"
      ? Dimensions.get("window").height
      : require("react-native-extra-dimensions-android").get(
          "REAL_WINDOW_HEIGHT"
        );

  const checkSubscription = async (id, subToPhone) => {
    try {
      const data = JSON.stringify({
        subscriberId: user.id,
        subscribedToId: id,
      });

      setModalVisible(true);
      setModalText("Checking payment status ...");
      const response = await fetch(
        `${API_BASE_URL}/v1/account/subscribe/${user.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + authState.userToken,
          },
          body: data,
        }
      );
      const json = await response.json();

      if (json.status === 0) {
        setSubscription(true);
        setModalVisible(false);
      } else {
        setSubscription(false);
        setModalText(json.message);
        setModalVisible(false);
        navigation.navigate("PayWall", { isUpgrade: false });
      }
    } catch (e) {
      console.error(e);
      setSubscription(false);
      setModalText("An error occurred while checking payment status");
      delay(1000 * 2).then((r) => {
        setModalVisible(false);
      });
    }
  };

  return (
    <View style={tw("flex-1")}>
      <View>
        <View style={tw("items-center justify-center h-80 w-full")}>
          <Image style={tw("h-96 w-96")} source={{ uri: userData?.imageURL }} />
        </View>

        {/* Tags Section */}
        {userData.accountTags && userData.accountTags.length > 0 && (
          <View style={tw("p-4 mt-8")}>
            <Text style={tw("text-lg font-bold mb-2")}>Tags:</Text>
            <View style={tw("flex-row flex-wrap")}>
              {userData.accountTags.map((tag, index) => (
                <View
                  key={index}
                  style={tw("bg-blue-200 px-4 py-2 rounded-lg m-1")}
                >
                  <Text style={tw("text-blue-800 font-bold")}>{tag.tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      <View style={tw("w-full flex-row justify-between h-20 px-6 py-2")}>
        <View>
          <Text style={tw("text-xl font-bold")}>
            {userData.firstName}, {userData.age} Yrs
          </Text>
        </View>

        <View>
          {user.paid ? (
            <Text style={tw("text-xl font-bold right: 0px ")}>
              {userData.phoneNumber}
            </Text>
          ) : (
            <Button
              onPress={() => {
                checkSubscription(userData.id, userData.phoneNumber);
              }}
              title="View Phone Number"
              color="#841584"
            />
          )}
        </View>
      </View>

      <Modal
        style={styles.modalContainer}
        isVisible={isModalVisible}
        hasBackdrop={true}
        deviceWidth={deviceWidth}
        deviceHeight={deviceHeight}
        backdropColor={"#00000031"}
      >
        <View style={styles.modalBody}>
          <Text style={styles.modalTextHeader}>Please wait</Text>

          {modalLoading ? (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color="#7CDB8A" />
            </View>
          ) : null}

          <Text style={styles.modalText}>{modalText}</Text>

          {modalShowButton ? (
            <View style={tw("flex-row justify-center items-center")}>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                }}
                style={tw(
                  "bg-indigo-600 w-1/2 py-2 items-center rounded-md mt-6"
                )}
              >
                <Text style={tw("text-white font-medium")}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  navigateToPayWall();
                }}
                style={tw(
                  "bg-indigo-600 w-1/2 py-2 items-center rounded-md mt-6"
                )}
              >
                <Text style={tw("text-white font-medium")}>Proceed</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
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
    maxHeight: "30%",
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
  },
  loading: {
    justifyContent: "center",
    alignItems: "center",
  },
});

export default ViewProfileScreen;
