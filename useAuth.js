import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import API_BASE_URL from "./lib/constants/baseUrl";
import messaging from "@react-native-firebase/messaging";
import * as SecureStore from "expo-secure-store";
import { initSocket, likeDislike, onNewMessage } from "./socket";
import { Alert, Linking, AppState, Platform } from "react-native";
import VersionCheck from "react-native-version-check";

const AuthContext = createContext();

export const AuthProvider = (props) => {
  const [error, setError] = useState(null);
  const [fcmToken, setFcmToken] = useState(null);
  const [notificationData, setNotification] = useState({});
  const [justLoggedIn, setJustLoggedIn] = useState(false);
  const [isVIP, setIsVIP] = useState(false);
  const appState = useRef(AppState.currentState);
  const [socket, setSocket] = useState(null);

  const [state, dispatch] = React.useReducer(
    (prevState, action) => {
      switch (action.type) {
        case "UPDATE_PROFILE_COMPLETE":
          return {
            ...prevState,
            isProfileComplete: action.isProfileComplete,
          };
        case "RESTORE_TOKEN":
          return {
            ...prevState,
            isLoading: false,
            user: action.user,
            userToken: action.token,
            currency: action.currency,
            tokenValid: action.tokenValid,
            countryCode: action.countryCode,
            isProfileComplete: action.isProfileComplete,
          };
        case "SIGN_IN":
          return {
            ...prevState,
            isSignout: false,
            user: action.user,
            userToken: action.token,
            currency: action.currency,
            tokenValid: action.tokenValid,
            countryCode: action.countryCode,
            isProfileComplete: action.isProfileComplete,
          };
        case "SIGN_OUT":
          return {
            ...prevState,
            user: null,
            currency: null,
            isSignout: true,
            userToken: null,
            tokenValid: false,
            countryCode: null,
            isProfileComplete: false,
          };
        case "UPDATE_PAYWALL_STATE":
          return {
            ...prevState,
            user: {
              ...prevState.user,
              paywall: action.paywall,
            },
          };
        default:
          return prevState;
      }
    },
    {
      user: null,
      isLoading: true,
      isSignout: false,
      userToken: null,
      tokenValid: false,
      isProfileComplete: true,
      currency: null,
      countryCode: null,
    }
  );

  const authContext = React.useMemo(
    () => ({
      signIn: async (data) => {
        dispatch({
          type: "SIGN_IN",
          token: data.token,
          user: data.user,
          currency: data.currency,
          tokenValid: data.tokenValid,
          countryCode: data.countryCode,
          isProfileComplete: data.isProfileComplete,
        });

        await SecureStore.setItemAsync("userToken", data.token);
        await SecureStore.setItemAsync(
          "user",
          JSON.stringify({
            ...data.user,
            currency: data.currency,
            countryCode: data.countryCode,
          })
        );
        setJustLoggedIn(true);
      },
      logout: async () => {
        dispatch({ type: "SIGN_OUT" });
        await SecureStore.deleteItemAsync("userToken");
        await SecureStore.deleteItemAsync("user");
      },
      signUp: async (data) => {
        dispatch({
          type: "SIGN_IN",
          token: data.token,
          user: data.user,
          currency: data.currency,
          tokenValid: data.tokenValid,
          countryCode: data.countryCode,
          isProfileComplete: data.isProfileComplete,
        });

        await SecureStore.setItemAsync("userToken", data.token);
        await SecureStore.setItemAsync("user", JSON.stringify(data.user));
        setJustLoggedIn(true);
      },
      updatePaywallState: async (paywall) => {
        dispatch({ type: "UPDATE_PAYWALL_STATE", paywall });

        try {
          const userString = await SecureStore.getItemAsync("user");
          if (userString) {
            const user = JSON.parse(userString);
            const updatedUser = {
              ...user,
              paywall: paywall,
            };

            await SecureStore.setItemAsync("user", JSON.stringify(updatedUser));
          }
        } catch (error) {
          console.error("Error updating user in AsyncStorage:", error);
        }
      },
      updateProfileComplete: async (isProfileComplete) => {
        dispatch({ type: "UPDATE_PROFILE_COMPLETE", isProfileComplete });
      },
      sendLikeDislike: (user_id, action) => {
        likeDislike(user_id, action);
      },
    }),
    []
  );

  const sendSmsVerification = async (phoneNumber, countryCode) => {
    try {
      const data = JSON.stringify({
        phone: phoneNumber,
        countryCode: countryCode,
      });
      console.log(`Data: ${data}`);
      const response = await fetch(`${API_BASE_URL}/v1/account/otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: data,
      });

      const json = await response.json();
      return json.success;
    } catch (error) {
      return false;
    }
  };

  const checkVerification = async (
    phoneNumber,
    countryCode,
    code,
    currency
  ) => {
    try {
      const data = JSON.stringify({
        phone: phoneNumber,
        countryCode: countryCode,
        otp: code,
      });

      const response = await fetch(`${API_BASE_URL}/v1/account/verifyotp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: data,
      });

      const json = await response.json();

      if (!json.accessToken) {
        return false;
      }
      // console.log("otp", json);

      let profile_complete = true;
      if (json && (!json.firstName || !json.gender)) {
        profile_complete = false;
      }

      const authData = {
        isProfileComplete: profile_complete,
        token: json.accessToken,
        tokenValid: true,
        countryCode,
        user: json,
        currency,
      };

      setJustLoggedIn(true);
      await authContext.signIn(authData);
      return json;
    } catch (error) {
      console.error("checkVerification", error);
      return false;
    }
  };

  const requestNotificationPermission = async () => {
    try {
      await messaging().requestPermission();
    } catch (error) {
      console.log("error requesting permission" + error);
    }
  };

  // Function to get FCM token and handle token refresh
  const handleFCMToken = async () => {
    try {
      const token = await messaging().getToken();
      if (token) {
        // Store the token in the state
        setFcmToken(token);
        console.log("FCM Device Token: ", token);
      } else {
        console.log("No FCM token available");
      }
    } catch (error) {
      console.error("Error getting FCM token: ", error);
    }
  };

  const validateToken = async (token) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/v1/account/tokenStatus?token=${token}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const json = await response.json();
      return json.valid;
    } catch (error) {
      console.error("validateToken", error);
      return false;
    }
  };

  const fetchUser = useCallback(async (user_id, userToken) => {
    if (!user_id || !userToken) {
      throw new Error("User ID and user token are required");
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/v1/account/get/${user_id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userToken}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch user data");
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching user:", error.message);
      throw error; // Re-throw the error to handle it elsewhere if needed
    }
  }, []);

  const checkAppVersionFirstThenProceed = async () => {
    try {
      const latestVersion = await fetch(
        `${API_BASE_URL}/v1/app-config/version-code`
      )
        .then((r) => r.json())
        .then((res) => {
          return res;
        });

      // const latestVersion =
      //   Platform.OS === "ios"
      //     ? await fetch(
      //         `https://itunes.apple.com/in/lookup?bundleId=host.exp.ignitecove`
      //       )
      //         .then((r) => r.json())
      //         .then((res) => {
      //           return res?.results[0]?.version;
      //         })
      //     : await VersionCheck.getLatestVersion({
      //         provider: "playStore",
      //         packageName: "host.exp.ignitecove",
      //         ignoreErrors: true,
      //       });

      const currentVersion = VersionCheck.getCurrentBuildNumber();

      if (latestVersion && latestVersion.mandatory) {
        if (Number(latestVersion.versionCode) > Number(currentVersion)) {
          Alert.alert(
            "Update Required",
            "A new version of the app is available. Please update to continue using the app.",
            [
              {
                text: "Update Now",
                onPress: async () => {
                  Linking.openURL(
                    Platform.OS === "ios"
                      ? await VersionCheck.getAppStoreUrl({
                          appID: "xxxxxxxxxx",
                        })
                      : await VersionCheck.getPlayStoreUrl({
                          packageName: "host.exp.ignitecove",
                        })
                  );
                },
              },
            ],
            { cancelable: false }
          );
        }
      }
      // else {
      //   <AuthContext.Provider
      //     value={{
      //       authContext,
      //       user: state.user,
      //       authState: state,
      //       sendSmsVerification,
      //       checkVerification,
      //       error,
      //       fcmToken,
      //       notificationData,
      //       justLoggedIn,
      //       setJustLoggedIn,
      //       isVIP,
      //       setIsVIP,
      //     }}
      //   >
      //     {props.children}
      //   </AuthContext.Provider>;
      // }
    } catch (error) {
      console.error("Error checking app version:", error);
    }
  };

  React.useEffect(() => {
    // Fetch the token from storage then navigate to our appropriate place
    const bootstrapAsync = async () => {
      let userToken, local_user;

      try {
        userToken = await SecureStore.getItemAsync("userToken");
        local_user = await SecureStore.getItemAsync("user");
        local_user = JSON.parse(local_user);
      } catch (e) {
        // Restoring token failed
      }

      const tokenStatus = await validateToken(userToken);

      if (tokenStatus) {
        setJustLoggedIn(true);
        const remote_user = await fetchUser(parseInt(local_user.id), userToken);
        const user = remote_user || local_user;
        let profile_complete = true;
        if (user && (!user.firstName || !user.gender)) {
          profile_complete = false;
        }

        dispatch({
          type: "RESTORE_TOKEN",
          token: userToken,
          tokenValid: tokenStatus,
          user: user,
          currency: local_user.currency,
          countryCode: local_user.countryCode,
          isProfileComplete: profile_complete,
        });

        await fetch(
          `${API_BASE_URL}/v1/account/premium-status/${local_user.id}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + userToken,
            },
          }
        )
          .then(async (response) => {
            if (response.ok) {
              return response.json();
            }
            const text = await response.json();
            throw new Error(text.error);
          })
          .then((data) => {
            setIsVIP(data?.data?.premium ? true : false);
          });
      }
    };

    // Call the function to get FCM token when the component mounts
    handleFCMToken().then((r) => console.log("token granted " + r));
    requestNotificationPermission().then((r) =>
      console.log("permission granted")
    );

    // check if user gave permission to receive push notifications
    messaging()
      .hasPermission()
      .then((enabled) => {
        if (!enabled) {
          requestNotificationPermission().then((r) =>
            console.log("permission granted")
          );
        }
      });

    // check if app opened from a notification
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log("FCM Message Data:", remoteMessage.data);
          setNotification(remoteMessage.data);
        }
      });

    messaging()
      .subscribeToTopic("all")
      .then((r) => console.log("subscribed to topic all"));
    messaging().onMessage(async (message) => {
      setNotification(message.data);
    });

    bootstrapAsync();
  }, []);

  useEffect(() => {
    if (!state.userToken) return;

    const socketConnection = initSocket(state.userToken);
    setSocket(socketConnection);

    onNewMessage((msg) => {
      console.log("New message:", msg);
      // Handle new messages globally if needed
    });

    return () => {
      socketConnection.disconnect();
    };
  }, [state]);

  // console.log("state", state);

  useEffect(() => {
    const versionCheck = AppState.addEventListener("change", (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        console.log("App has come to the foreground!");
        checkAppVersionFirstThenProceed();
      }

      appState.current = nextAppState;
    });

    return () => {
      versionCheck.remove();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        authContext,
        user: state.user,
        authState: state,
        sendSmsVerification,
        checkVerification,
        error,
        fcmToken,
        notificationData,
        justLoggedIn,
        setJustLoggedIn,
        isVIP,
        setIsVIP,
        socket,
      }}
    >
      {props.children}
    </AuthContext.Provider>
  );
};

export default function useAuth() {
  return useContext(AuthContext);
}
