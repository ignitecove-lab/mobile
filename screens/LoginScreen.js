import React, {useEffect, useState, useLayoutEffect} from "react";
import {Dimensions, Image, Text, TouchableOpacity, View} from "react-native";
import {useNavigation} from "@react-navigation/native";
import tw from "tailwind-rn";
import Checkbox from "expo-checkbox";
import ReusableModal from "./ReusableModal";


const LoginScreen = () => {
  const navigation = useNavigation();
  const [isChecked, setIsChecked] = useState(false);
  const getStarted = () => {
    setModalVisible(false); // Hide modal when navigating to PhoneNumber screen
    navigation.navigate("PhoneNumber");
  };
  const goToTermsScreen = () => {
    navigation.navigate("Terms of Service"); // Replace with the actual route name for your Terms Screen
  };
  const [isModalVisible, setModalVisible] = useState(true);
  const goToPrivacyPolicyScreen = () => {
    navigation.navigate("Privacy Policy"); // Replace with the actual route name for your Privacy Policy Screen
  };
  useEffect(() => {
    const timer = setTimeout(() => {
      setModalVisible(false);
    }, 5000);

    return () => {
      clearTimeout(timer);
       navigation.addListener('beforeRemove', () => {
        setModalVisible(false);
      });
    };
  }, [navigation]);
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: "Ignitecove",
      headerStyle: {
        backgroundColor: "white",
      },
      headerTitleStyle: { color: "black" },
    });
  }, []);

  return (
     <>
       { isModalVisible ? (
          <ReusableModal
             isVisible={isModalVisible}
             onBackdropPress={() => setModalVisible(false)}
             deviceWidth={Dimensions.get("window").width}
             deviceHeight={Dimensions.get("window").height}
             headerText=""
             bodyText="Getting things in order"
             isLoading={true}
          />
       ) : (
         <View style={[tw("flex-1 flex-col items-center justify-around"), { gap: 20 }]}>
     <View style={tw("flex-row justify-center mt-4")}>
       <Checkbox
          value={isChecked}
          onValueChange={setIsChecked}
          style={tw("mr-2")}
       />
       <TouchableOpacity onPress={goToTermsScreen}>
         <Text style={tw("text-blue-500 underline pr-2")}>Terms</Text>
       </TouchableOpacity>
       <Text style={tw("text-gray-500")}>&</Text>
       <TouchableOpacity onPress={goToPrivacyPolicyScreen}>
         <Text style={tw("text-blue-500 underline pl-2")}>
           Privacy Policy
         </Text>
       </TouchableOpacity>
     </View>
     <Image
        source={require('../logo.png')}
        style={{ width: 200, height: 200 }}
     />
     <TouchableOpacity
        style={[
          tw(" w-52 bg-white p-4"),
          {
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            alignSelf: "center",
            marginHorizontal: 0,
            borderRadius: 10,
            elevation: 5,
            marginTop: 20,
          },

          isChecked
             ? { backgroundColor: "#F2452A" }
             : { backgroundColor: "gray" },
        ]}
        onPress={isChecked ? getStarted : null}
     >
       <Text
          style={[
            tw("font-semibold text-center"),
            isChecked ? { color: "white" } : { color: "black" },
          ]}
       >
         Sign In & Connect
       </Text>
     </TouchableOpacity>
     </View>
      )}
     </>

  );
};

export default LoginScreen;
