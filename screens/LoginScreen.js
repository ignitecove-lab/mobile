import React, { useState } from "react";
import { View, Text, ImageBackground, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import tw from "tailwind-rn";
import Checkbox from "expo-checkbox";

const LoginScreen = () => {
  const navigation = useNavigation();
  const [isChecked, setIsChecked] = useState(false);
  const getStarted = () => {
    navigation.navigate("PhoneNumber");
  };

  const goToTermsScreen = () => {
    navigation.navigate("Terms of Service"); // Replace with the actual route name for your Terms Screen
  };

  const goToPrivacyPolicyScreen = () => {
    navigation.navigate("Privacy Policy"); // Replace with the actual route name for your Privacy Policy Screen
  };

  return (
    <View style={tw("flex-1 bg-red-50")}>
      <ImageBackground
        resizeMode="contain"
        style={tw("flex-1 max-h-full")}
        source={require("../logo.png")}
      >
        <TouchableOpacity
          style={[
            tw("absolute bottom-40 w-52 bg-white p-4"),
            {
              marginHorizontal: "25%",
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

        {/* Links to Terms and Privacy Policy */}
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
      </ImageBackground>
    </View>
  );
};

export default LoginScreen;
