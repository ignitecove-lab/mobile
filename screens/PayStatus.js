import { View, TouchableOpacity, Text } from "react-native";
import { useNavigation } from "@react-navigation/native";
import messaging from "@react-native-firebase/messaging";
import tw from "tailwind-rn";
import { AntDesign } from "@expo/vector-icons";
import useAuth from "../useAuth";
import TiktokPixel from 'tiktok-pixel';

import React, {
   useEffect,
   useState
} from "react";
import {
   ActivityIndicator,
   StyleSheet,
} from "react-native";
import API_BASE_URL from "../lib/constants/baseUrl";


const PayStatus = ({ route}) => {
   const navigation = useNavigation();
   const [isLoading, setIsLoading] = useState(true);
   const {authState, authContext } = useAuth();
   const { refreshScreen, currency, amount } = route.params;

   useEffect(() => {
      // const advancedMatching = {
      //    user_id: authState.user.id,
      // };
      // const options = {
      //    debug: true, // enable logs
      // };
      // TiktokPixel.init('', advancedMatching, options);

      let isCallSuccessful = false; // Flag to track success

      const makeApiCall = async () => {
         try {
            const data = JSON.stringify({
               subscriberId: authState.user.id,
               subscribedToId: null,
            });

            const response = await fetch(
               `${API_BASE_URL}/v1/account/subscribe/${authState.user.id}`,
               {
                  method: "POST",
                  headers: {
                     "Content-Type": "application/json",
                     Authorization: `Bearer ${authState.userToken}`,
                  },
                  body: data,
               }
            );

            const json = await response.json();
            if (json.status === 0) {
               isCallSuccessful = true;
               setIsLoading(false);
               // console.log(`Tittok amount: ${amount} currency ${currency}`)
               // TiktokPixel.track('CompletePayment', {
               //    currency: currency,
               //    value: amount
               // }, options);
            }
            else
               isCallSuccessful = false;

         } catch (error) {
            console.error("Error calling subscribe endpoint: ", error);
         }
      };

      // Call the API immediately
      makeApiCall();

      // Schedule subsequent API calls only if the first call fails
      const secondCall = setTimeout(() => {
         if (!isCallSuccessful) {
            void makeApiCall(); // Make second call
         }
      }, 15000); // After 15 seconds

      const thirdCall = setTimeout(() => {
         if (!isCallSuccessful) {
            void makeApiCall();
            setIsLoading(false);
            navigation.goBack(); // Navigate back after the third call
         }
      }, 30000); // After 30 seconds

      // Notification handling
      const subscribeOnMessage = messaging().onMessage(async (remoteMessage) => {
         if (remoteMessage.notification?.body === "payment successful") {
            clearTimeout(secondCall);
            clearTimeout(thirdCall);
            await authContext.updatePaywallState(false);
            setIsLoading(false);
         }
      });

      messaging()
         .getInitialNotification()
         .then((remoteMessage) => {
            if (remoteMessage?.notification?.body === "payment successful") {
               clearTimeout(secondCall);
               clearTimeout(thirdCall);
               authContext.updatePaywallState(false);
               setIsLoading(false);
            }
         });

      // Cleanup on unmount
      return () => {
         subscribeOnMessage();
         clearTimeout(secondCall);
         clearTimeout(thirdCall);
      };
   }, [authContext, authState.user.id, authState.userToken]);



   return (
      <View style={tw("h-full items-center p-12 pt-40")}>
         {isLoading ? (
            <LoadingIndicator />
         ) : (
            <View style={tw("bg-white w-full p-6 rounded-lg items-center")}>
               <AntDesign name="check" size={24} color="green" />
               <Text style={tw("text-gray-800 text-xl font-medium mt-4")}>
                  Payment Successful
               </Text>
               <Text style={tw("text-gray-600 text-center mt-2 w-56")}>
                  You can now view 2 contacts.
               </Text>
               <TouchableOpacity
                  onPress={() => {
                     if (!authState?.user?.firstName || !authState?.user?.gender || !authState?.user?.age) {
                        navigation.navigate("Modal");
                     } else {
                        navigation.navigate("Home", { fetchProfile: refreshScreen  ?? false});
                     }
                  }}
                  style={tw("bg-indigo-600 w-full py-2 items-center rounded-md mt-6")}
               >
                  <Text style={tw("text-white font-medium")}>Go back to Profiles</Text>
               </TouchableOpacity>
            </View>
         )}
      </View>
   );
};

const LoadingIndicator = ({ size = "large", color = "#007bff" }) => {
   return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", flexFlow: "column" }}>
         <Text style={styles.title}>Initializing payment</Text>
         <ActivityIndicator size={size} color={color} />
      </View>
   );
};

const styles = StyleSheet.create({
   title: {
      fontSize: 18,
      marginBottom: 20,
      textAlign: "center",
   },
})

export default PayStatus;
