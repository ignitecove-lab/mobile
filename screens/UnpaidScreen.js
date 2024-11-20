import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  ImageBackground,
} from "react-native";
import useAuth from "../useAuth";
import React, { useEffect, useState, useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import { BlurView } from "@react-native-community/blur";
import API_BASE_URL from "../lib/constants/baseUrl";
import ReusableModal from "./ReusableModal";

const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};
const { width, height } = Dimensions.get("window");

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
        if (!authState?.user?.firstName || !authState?.user?.gender || !authState?.user?.age) {
          navigation.navigate("Modal");
        } else {
          await navigation.navigate("Home", {fetchProfile: true});
        }
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
     <SafeAreaView style={styles.container}>
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
       {
         isModalVisible ? (<ReusableModal
            isVisible={isModalVisible}
            onBackdropPress={() => setModalVisible(false)}
            headerText="Loading"
            bodyText="We are processing your requst"
            isLoading={true}
         />) : (<></>)
       }

       <View style={styles.popup}>
         <Text style={styles.popupText}>You're a total catch!</Text>
         <Text style={styles.popupSubText}>
           Let the right people find you with IgniteCove Premium. Join IgniteCove today!
         </Text>
         <TouchableOpacity style={styles.button} onPress={checkPaywall}>
           <Text style={styles.buttonText}>Join IgniteCove</Text>
         </TouchableOpacity>
       </View>
     </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  absolute: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  profileContainer: {
    padding: 10,
  },
  profileImage: {
    width: (width - 50) / 2,
    height: (height - 200) / 3,
    borderRadius: 10,
    overflow: "hidden",
  },
  popup: {
    position: "absolute",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
  },
  popupText: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  popupSubText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default App;
