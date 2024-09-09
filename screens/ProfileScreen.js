import React, { useCallback } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/core";
import tw from "tailwind-rn";
import useAuth from "../useAuth";
import API_BASE_URL from "../lib/constants/baseUrl";

const ProfileScreen = () => {
  const [user, setUser] = React.useState(null);
  const { authContext, authState, isVIP } = useAuth();
  const { logout } = authContext;
  const navigation = useNavigation();

  const fetchUser = useCallback(async () => {
    await fetch(`${API_BASE_URL}/v1/account/get/${authState.user?.id}`, {
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
      .then(async (data) => {
        setUser(data);
      })
      .catch((err) => {
        console.log("fetchUser error", err);
      });
  }, []);

  React.useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <View style={tw("flex-1")}>
      {/* User Image */}
      <View style={tw("flex items-center justify-center")}>
        {user?.imageURL && (
          <Image
            style={tw("h-40 w-40 rounded-full")}
            source={{
              uri: user?.imageURL?.startsWith("http://")
                ? user?.imageURL?.replace("http://", "https://")
                : user?.imageURL,
            }}
          />
        )}
      </View>

      {/* User Details */}
      <View style={tw("flex")}>
        <View style={tw("p-4")}>
          <Text style={tw("text-2xl font-bold text-center")}>
            {user?.firstName}
          </Text>
          <Text style={tw("text-xl text-center")}>{user?.age} years old</Text>
        </View>
      </View>

      {/*Tags Section */}
      {user?.accountTags && user?.accountTags.length > 0 && (
        <View style={tw("p-4")}>
          <Text style={tw("text-lg font-bold mb-2")}>Tags:</Text>
          <View style={tw("flex-row flex-wrap")}>
            {user.accountTags?.map((tag, index) => (
              <View
                key={index}
                style={tw("bg-blue-200 px-4 py-2 rounded-lg m-1")}
              >
                <Text style={tw("text-black font-bold")}>{tag.tag}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Logout Button */}
      <View style={tw("flex-1 items-center justify-center")}>
        <TouchableOpacity
          style={tw("bg-red-500 py-2 px-4 rounded-lg")}
          onPress={() => {
            logout();
          }}
        >
          <Text style={tw("text-white text-xl px-8 font-bold")}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ProfileScreen;
