import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  ImageBackground,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import Modal from "react-native-modal";
import { BlurView } from "@react-native-community/blur";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../hooks/useAuth";
import ReusableModal from "./ReusableModal"; // Assuming this is your auth hook

const { width, height } = Dimensions.get("window");
const API_BASE_URL = "https://api.ignitecove.com";

const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const App = () => {
  const [shuffledProfiles, setShuffledProfiles] = useState([]);
  const [blurKey, setBlurKey] = useState(0);
  const [isModalVisible, setModalVisible] = useState(false);
  const { authState, authContext } = useAuth();
  const navigation = useNavigation();

  const profiles = [
    { id: "1", src: require("../persons/1.jpg") },
    { id: "2", src: require("../persons/2.jpg") },
    { id: "3", src: require("../persons/3.jpg") },
    { id: "4", src: require("../persons/4.jpg") },
    { id: "5", src: require("../persons/5.jpg") },
    { id: "6", src: require("../persons/6.jpg") },
  ];

  const checkPaywall = useCallback(async () => {
    try {
      setModalVisible(true);
      const response = await fetch(`${API_BASE_URL}/v1/account/paywall-status`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authState.userToken}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch paywall status");

      const json = await response.json();
      setModalVisible(false);

      if (json?.data?.paywall === false) {
        await authContext.updatePaywallState(false);
        await navigation.navigate("Home", {fetchProfile: true});
      } else {
        await navigation.navigate("PayWall", {isUpgrade: false});
      }
    } catch (error) {
      setModalVisible(false);
      console.error("Paywall check failed:", error);
    }
  }, [authState.userToken, authContext, navigation]);

  useEffect(() => {
    checkPaywall();
    const shuffled = shuffleArray([...profiles]).slice(0, 6);
    setShuffledProfiles(shuffled);

    const unsubscribe = navigation.addListener("focus", () => {
      setBlurKey((prevKey) => prevKey + 1);
    });

    return unsubscribe;
  }, [checkPaywall, navigation]);

  return (
     <View style={styles.container}>
       <FlatList
          data={shuffledProfiles}
          keyExtractor={(item) => item.id}
          numColumns={2}
          renderItem={({ item }) => (
             <View style={styles.profileContainer}>
               <ImageBackground source={item.src} style={styles.profileImage}>
                 <BlurView
                    key={blurKey}
                    style={styles.absolute}
                    blurType="dark"
                    blurAmount={20}
                    reducedTransparencyFallbackColor="white"
                 />
               </ImageBackground>
             </View>
          )}
       />
       <ReusableModal
          isVisible={isModalVisible}
          onBackdropPress={() => setModalVisible(false)}
          headerText="Loading"
          bodyText="Your request is being processed."
          isLoading={true}
       />
       <View style={styles.popup}>
         <Text style={styles.popupText}>You're a total catch!</Text>
         <Text style={styles.popupSubText}>
           Let the right people find you with IgniteCove Premium. Join IgniteCove today!
         </Text>
         <TouchableOpacity style={styles.button} onPress={checkPaywall}>
           <Text style={styles.buttonText}>Join IgniteCove</Text>
         </TouchableOpacity>
       </View>
     </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileContainer: {
    flex: 1,
    margin: 10,
  },
  profileImage: {
    width: "100%",
    height: 150,
  },
  absolute: {
    ...StyleSheet.absoluteFillObject,
  },
  modalBody: {
    backgroundColor: "white",
    borderRadius: 10,
    overflow: "hidden",
  },
  popup: {
    padding: 20,
    alignItems: "center",
  },
  popupText: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  popupSubText: {
    fontSize: 14,
    marginVertical: 10,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default App;
