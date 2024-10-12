import * as React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "./screens/HomeScreen";
import LoginScreen from "./screens/LoginScreen";
import ProfileScreen from "./screens/ProfileScreen";
import useAuth from "./useAuth";
import TermsScreen from "./screens/TermsScreen";
import PrivacyPolicy from "./screens/PrivacyPolicy";
import ModalScreen from "./screens/ModalScreen";
import MatchScreen from "./screens/MatchScreen";
import Otp from "./screens/Otp";
import PhoneNumber from "./screens/PhoneNumber";
import PaywallScreen from "./screens/PaywallScreen";
import SearchScreen from "./screens/SearchScreen";
import ViewProfileScreen from "./screens/ViewProfile";
import SearchResult from "./screens/SearchResult";
import { FontAwesome } from "@expo/vector-icons";
import PayStatus from "./screens/PayStatus";
import Unpaid from "./screens/UnpaidScreen";
import { Text, Image, View, TouchableOpacity } from "react-native";
import Profile from "./screens/Profile";
import { useNavigation } from "@react-navigation/native";

const Stack = createNativeStackNavigator();

const HeaderLeft = () => {
  const navigation = useNavigation();

  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={{ marginRight: 1 }}
      >
        <FontAwesome name="arrow-left" size={20} color="#000" />
      </TouchableOpacity>
      <Image
        source={require("./logo.png")}
        style={{ width: 50, height: 50, marginLeft: 15 }}
      />
    </View>
  );
};

const StackNavigator = () => {
  const { authState, isVIP } = useAuth();
  console.log(authState);

  return (
    <Stack.Navigator
      sreenOptions={{
        headerShown: false,
      }}
    >
      {authState && authState?.tokenValid ? (
        <>
          <Stack.Group>
            {authState?.user?.paywall && (
              <Stack.Screen
                options={{ headerShown: false }}
                name="Paywall"
                component={Unpaid}
              />
            )}

            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={
                isVIP && {
                  headerRight: () => (
                    <FontAwesome
                      name="tag"
                      size={10}
                      color="white"
                      style={{
                        backgroundColor: "#3944bc",
                        padding: 10,
                        borderRadius: 8,
                      }}
                    >
                      <Text> VIP</Text>
                    </FontAwesome>
                  ),
                  headerRightContainerStyle: {
                    paddingRight: 15,
                  },
                }
              }
            />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Profile_View" component={ViewProfileScreen} />
            <Stack.Screen name="PayWall" component={PaywallScreen} />
            <Stack.Screen name="Search" component={SearchScreen} />
            <Stack.Screen name="SearchResult" component={SearchResult} />
            <Stack.Screen name="Search Result" component={SearchResult} />
            <Stack.Screen name="PayStatus" component={PayStatus} />
            <Stack.Screen
              name="MyProfile"
              component={Profile}
              options={{
                headerRight: isVIP
                  ? () => (
                      <FontAwesome
                        name="tag"
                        size={10}
                        color="white"
                        style={{
                          backgroundColor: "#3944bc",
                          padding: 10,
                          borderRadius: 8,
                        }}
                      >
                        <Text> VIP</Text>
                      </FontAwesome>
                    )
                  : undefined,
                headerRightContainerStyle: {
                  paddingRight: 15,
                },
              }}
            />
            <Stack.Screen
              options={{ headerShown: false }}
              name="Ignitecove"
              component={Unpaid}
            />
          </Stack.Group>

          <Stack.Group screenOptions={{ presentation: "modal" }}>
            <Stack.Screen name="Modal" component={ModalScreen} />
          </Stack.Group>

          <Stack.Group screenOptions={{ presentation: "transparentModal" }}>
            <Stack.Screen name="Match" component={MatchScreen} />
          </Stack.Group>
        </>
      ) : (
        <Stack.Group>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Terms of Service" component={TermsScreen} />
          <Stack.Screen name="Privacy Policy" component={PrivacyPolicy} />
          <Stack.Screen name="PhoneNumber" component={PhoneNumber} />
          <Stack.Screen name="Otp" component={Otp} />
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
};

export default StackNavigator;
