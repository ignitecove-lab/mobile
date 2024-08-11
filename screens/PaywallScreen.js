import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  forwardRef,
} from "react";
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  FlatList,
  TextInput,
} from "react-native";
import { BottomSheetView, BottomSheetModal } from "@gorhom/bottom-sheet";
import { Colors } from "react-native/Libraries/NewAppScreen";
import PhoneInput from "react-native-phone-number-input";
import { useNavigation } from "@react-navigation/native";
import API_BASE_URL from "./../lib/constants/baseUrl";
import messaging from "@react-native-firebase/messaging";
import RadioButtonRN from "radio-buttons-react-native";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import Modal from "react-native-modal";
import useAuth from "../useAuth";

const CLOSE_URL = `https://standard.paystack.co/close`;
const ps_cancel_url = `${API_BASE_URL}/paystack/cancel`;
const ps_callback = `${API_BASE_URL}/paystack/callback`;

const PurchasePlansScreen = ({ plans, setPlanId, setNext }) => {
  const renderPlan = ({ item }) => (
    <View style={styles.planContainer}>
      <Text style={styles.planName}>{item.name}</Text>
      {item.planDetails &&
        item.planDetails.map((price, index) => (
          <Text key={index} style={styles.planPrice}>
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: price.currency === "$" ? "USD" : "KES",
            }).format(price.price)}
          </Text>
        ))}

      <TouchableOpacity
        style={styles.chooseButton}
        onPress={() => {
          setPlanId(item.id);
          setNext(true);
        }}
      >
        <Text style={styles.chooseButtonText}>Choose Plan</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={{ padding: 10 }}>
      <Text style={styles.title}>Select Plan</Text>
      <FlatList
        data={plans}
        renderItem={renderPlan}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const CustomBottomSheetModal = forwardRef(
  ({ snapPoints = ["70%", "90%"], onChange, children }, ref) => {
    return (
      <View style={styles.container}>
        <BottomSheetModal
          ref={ref}
          snapPoints={snapPoints}
          onChange={onChange}
          enablePanDownToClose={true}
          keyboardBehavior="fillParent"
        >
          <BottomSheetView style={styles.contentContainer}>
            {children}
          </BottomSheetView>
        </BottomSheetModal>
      </View>
    );
  }
);

const LoadingIndicator = ({ size = "large", color = "#007bff" }) => {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <ActivityIndicator size={size} color={color} />
    </View>
  );
};

const PaywallScreen = ({ route }) => {
  const [authorizationUrl, setAuthorizationUrl] = useState(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [formattedValue, setFormattedValue] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [codeError, setCodeError] = useState(null);
  const [modalText, setModalText] = useState("");
  const [planId, setPlanId] = useState(null);
  const [value, setValue] = useState("");
  const [plans, setPlans] = useState([]);
  const [next, setNext] = useState(false);
  const { isUpgrade } = route.params;
  const bottomSheetRef = useRef(null);

  const phoneInput = useRef(null);
  const navigation = useNavigation();

  const delay = (ms) => new Promise((res) => setTimeout(res, ms));

  const { fcmToken, notificationData, authState, authContext, isVIP } =
    useAuth();

  const deviceWidth = Dimensions.get("window").width;
  const deviceHeight =
    Platform.OS === "ios"
      ? Dimensions.get("window").height
      : require("react-native-extra-dimensions-android").get(
          "REAL_WINDOW_HEIGHT"
        );

  const fetchPlans = useCallback(async () => {
    setIsLoading(true);
    await fetch(`${API_BASE_URL}/v1/plan`, {
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
        if (isUpgrade) {
          const plans = data?.find((obj) => obj.name === "BRONZE");
          setPlans([plans]);
        } else if (authState?.user.paywall) {
          setPlans(data);
        } else if (!isVIP && !isUpgrade) {
          const plans = data?.find((obj) => obj.name === "SILVER");
          setPlans([plans]);
        } else {
          setPlans(data);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.log("fetchPlans error", err);
      });
  }, []);

  useEffect(() => {
    // Foreground/background message handling
    const unsubscribeOnMessage = messaging().onMessage(
      async (remoteMessage) => {
        console.log(`Notification ${remoteMessage.notification?.body}`);
        if (
          remoteMessage &&
          remoteMessage.notification &&
          remoteMessage.notification?.body
        ) {
          console.log("Foreground/Background Message:", remoteMessage);
          // Check if the message body contains a specific keyword
          if (remoteMessage.notification?.body === "payment successful") {
            // Perform actions when the keyword is found in the message body
            console.log("Message contains the keyword!");

            let navigationParams = { phoneNumber: formattedValue };
            if (authState?.user.paywall) {
              navigationParams.redirectScreen = "ModalScreen";
            }

            authContext.updatePaywallState(false);
            setModalVisible(false);
            bottomSheetRef.current.dismiss();

            navigation.navigate("PayStatus", navigationParams);
          } else {
            console.log(
              "Message does not contain the keyword!" +
                remoteMessage.notification?.body
            );
          }
        }
      }
    );

    // App terminated message handling
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (
          remoteMessage &&
          remoteMessage.notification &&
          remoteMessage.notification?.body
        ) {
          if (remoteMessage.notification?.body === "payment successful") {
            // Perform actions when the keyword is found in the message body
            console.log("Initial notification contains the keyword!");
            authContext.updatePaywallState(false);
            setModalVisible(false);
            navigation.navigate("PayStatus", {
              phoneNumber: formattedValue,
              redirectScreen: "ModalScreen",
            });
            bottomSheetRef.current.dismiss();
          } else {
            console.log(
              "Initial notification does not contain the keyword!" +
                remoteMessage.notification?.body
            );
          }
        }
      });

    fetchPlans();

    return () => {
      unsubscribeOnMessage();
    };
  }, [fcmToken, notificationData]);

  const initiatePayment = async (phoneNumber, fcmToken) => {
    setModalVisible(true);

    try {
      setModalText("Initiating payment ...");
      const data = JSON.stringify({
        planId: parseInt(planId),
        Amount: "1",
        PhoneNumber: phoneNumber,
        FCMToken: fcmToken,
        AccountToSubscribe: null,
        referralCode,
      });
      const response = await fetch(`${API_BASE_URL}/v1/mps/lipa-na-mpesa`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authState.userToken}`,
        },
        body: data,
      });

      const json = await response.json();

      console.log(json);

      return json;
    } catch (error) {
      setModalText("An error occurred while initiating payment");
      console.error("an error occurred while initiating payment");
      console.error(error);
      await delay(1000);
      setModalVisible(false);
      return false;
    } finally {
      delay(1000).then((r) => {
        setModalVisible(false);
      });
    }
  };

  const radioData = plans &&
    plans?.length > 0 && [
      {
        label: (
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ width: 100, height: 70 }}>
              <Image
                source={require("../lipa_na_mpesa.png")}
                style={{ width: "100%", height: "100%", resizeMode: "contain" }}
              />
            </View>
            <Text
              style={{ marginLeft: 10 }}
            >{`Lipa na Mpesa ${new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "KES",
            }).format(
              plans?.find((plan) => plan?.id === planId)?.planDetails[0]
                ?.price || 0
            )}`}</Text>
          </View>
        ),
        value: "lipa_na_mpesa",
      },
      //      {
      //        label: (
      //          <View style={{ flexDirection: "row", alignItems: "center" }}>
      //            <View style={{ width: 100, height: 50 }}>
      //              <Image
      //                source={require("../pay_by_card.webp")}
      //                style={{ width: "100%", height: "100%", resizeMode: "contain" }}
      //              />
      //            </View>
      //            <Text
      //              style={{ marginLeft: 10 }}
      //            >{`Pay By card ${new Intl.NumberFormat("en-US", {
      //              style: "currency",
      //              currency: "USD",
      //            }).format(
      //              plans?.find((plan) => plan?.id === planId)?.planDetails[1]
      //                ?.price || 0
      //            )}`}</Text>
      //          </View>
      //        ),
      //        value: "pay_by_card",
      //      },
    ];

  const getCheckoutURL = async () => {
    const authURL = await fetch(
      `${API_BASE_URL}/v1/paystack/init-transaction`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authState.userToken}`,
        },
        body: JSON.stringify({
          email: `${authState?.user?.phoneNumber}@ignitecove.com`,
          callback_url: ps_callback,
          cancel_url: ps_cancel_url,
          planId: parseInt(planId),
          referralCode,
        }),
      }
    )
      .then(async (response) => {
        const data = await response.json();
        if (response.ok) {
          return data.authorization_url;
        }
        throw new Error(data.error);
      })
      .catch((err) => {
        console.log("error", err.message);
      });

    if (authURL) {
      setAuthorizationUrl(authURL);
      setShowModal(true);
    }
  };

  const onNavigationStateChange = (state) => {
    const { url } = state;

    if (!url) return;

    if (containsPart(url, ps_callback)) {
      setShowModal(false);
      setAuthorizationUrl(null);
      setIsLoading(false);
      bottomSheetRef.current.dismiss();
      navigation.navigate("PayStatus", {
        phoneNumber: formattedValue,
      });
    }

    if (url === ps_cancel_url) {
      setIsLoading(false);
      setShowModal(false);
      setAuthorizationUrl(null);
    }

    if (url === CLOSE_URL) {
      setShowModal(false);
      setIsLoading(false);
      setAuthorizationUrl(null);
      bottomSheetRef.current.dismiss();
      navigation.navigate("PayStatus", {
        phoneNumber: formattedValue,
      });
    }
  };

  function containsPart(url, part) {
    const escapedPart = part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escapedPart);

    return regex.test(url);
  }

  const handleOpenSheet = () => {
    if (bottomSheetRef.current) {
      bottomSheetRef.current?.present();
    }
  };

  const handleReferralCodeChange = async (code) => {
    setReferralCode(code);

    const valid = await fetch(
      `${API_BASE_URL}/v1/referral/validate?code=${code}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authState.userToken}`,
        },
      }
    )
      .then(async (response) => {
        const data = await response.json();
        if (response.ok) {
          return data.valid;
        }
        throw new Error(data.error);
      })
      .catch((err) => {
        console.log("error", err.message);
      });

    setCodeError(valid ? "" : "Invalid Referral Code");
  };

  const handleClosePress = () => bottomSheetRef.current.dismiss();

  return (
    <View style={styles.container}>
      {isLoading && <LoadingIndicator />}

      {!next && !isLoading && plans && plans.length > 0 && (
        <PurchasePlansScreen
          plans={plans}
          setPlanId={setPlanId}
          setNext={setNext}
        />
      )}

      {next && planId && (
        <>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              setNext(false);
              setPlanId(null);
              setPaymentMethod(null);
              handleClosePress();
            }}
          >
            <Ionicons name="arrow-back" size={24} color="black" />
            <Text style={styles.backButtonText}>Choose Another Plan</Text>
          </TouchableOpacity>

          <RadioButtonRN
            data={radioData}
            selectedBtn={(e) => {
              setPaymentMethod(e.value);
              handleOpenSheet();
            }}
          />
        </>
      )}

      <View style={{ flex: 1 }}>
        <CustomBottomSheetModal ref={bottomSheetRef} snapPoints={["70%"]}>
          {plans &&
            plans.length > 0 &&
            plans?.find((obj) => obj.name === "BRONZE") && (
              <View style={styles.welcome}>
                <Text style={styles.referralLabel}>Referral Code</Text>
                <TextInput
                  style={styles.referralInput}
                  placeholder="IGC-XXXX"
                  onChangeText={handleReferralCodeChange}
                />

                {codeError ? (
                  <Text style={styles.labelErrorText}>{codeError}</Text>
                ) : null}
              </View>
            )}

          {paymentMethod === "lipa_na_mpesa" && (
            <>
              <View style={styles.welcome}>
                <Text>MPESA NUMBER</Text>
              </View>
              <PhoneInput
                ref={phoneInput}
                defaultValue={value}
                defaultCode="KE"
                layout="first"
                onChangeText={(text) => {
                  setValue(text);
                }}
                onChangeFormattedText={(text) => {
                  setFormattedValue(text);
                }}
                countryPickerProps={{ withAlphaFilter: true }}
                withShadow
                autoFocus
              />
              <TouchableOpacity
                style={styles.button}
                onPress={async () => {
                  let formattedPhoneNum =
                    phoneInput.current?.getNumberAfterPossiblyEliminatingZero()
                      .formattedNumber;
                  initiatePayment(formattedPhoneNum, fcmToken).then(
                    (result) => {
                      console.log("this is the result ... " + result);
                    }
                  );
                }}
              >
                <Text style={styles.buttonText}>Initiate Payment</Text>
              </TouchableOpacity>
              <Modal
                style={styles.modalContainer}
                isVisible={isModalVisible}
                hasBackdrop={true}
                deviceWidth={deviceWidth}
                deviceHeight={deviceHeight}
                backdropColor={"#00000031"}
              >
                <View style={styles.modalBody}>
                  <Text style={styles.modalTextHeader}>M-Pesa Payment</Text>
                  <View style={styles.loading}>
                    <ActivityIndicator size="large" color="#7CDB8A" />
                  </View>
                  <Text style={styles.modalText}>{modalText}</Text>
                </View>
              </Modal>
            </>
          )}

          {paymentMethod === "pay_by_card" && (
            <>
              <TouchableOpacity
                style={styles.button}
                onPress={async () => {
                  await getCheckoutURL();
                }}
              >
                <Text style={styles.buttonText}>Initiate Payment</Text>
              </TouchableOpacity>

              {authorizationUrl && showModal && (
                <Modal
                  style={{ flex: 1 }}
                  visible={showModal}
                  animationType="slide"
                  transparent={false}
                >
                  <SafeAreaView style={{ flex: 1 }}>
                    <WebView
                      style={[{ flex: 1 }]}
                      source={{ uri: authorizationUrl }}
                      onLoadStart={() => setIsLoading(true)}
                      onLoadEnd={() => setIsLoading(false)}
                      onNavigationStateChange={onNavigationStateChange}
                      cacheEnabled={false}
                      cacheMode={"LOAD_NO_CACHE"}
                    />

                    {isLoading && (
                      <View>
                        <ActivityIndicator size="large" color={"green"} />
                      </View>
                    )}
                  </SafeAreaView>
                </Modal>
              )}
            </>
          )}
        </CustomBottomSheetModal>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  referralInput: {
    marginTop: 8,
    marginLeft: 15,
    marginRight: 15,
    marginBottom: 10,
    borderRadius: 10,
    fontSize: 16,
    lineHeight: 20,
    padding: 8,
    width: Dimensions.get("window").width - 50,
    backgroundColor: "rgba(151, 151, 151, 0.25)",
  },
  referralLabel: {
    marginLeft: 15,
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  labelErrorText: {
    color: "red",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 15,
  },
  contentContainer: {
    flex: 1,
    alignItems: "center",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 5,
  },
  backButtonText: {
    fontSize: 16,
    marginLeft: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  listContainer: {
    paddingBottom: 20,
  },
  planContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  planName: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  planPrice: {
    fontSize: 16,
    marginBottom: 5,
    textAlign: "center",
  },
  chooseButton: {
    marginTop: 10,
    backgroundColor: "#007bff",
    paddingVertical: 10,
    borderRadius: 40,
    alignItems: "center",
  },
  chooseButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  container: {
    flex: 1,
    backgroundColor: Colors.lighter,
  },
  emailContainer: {
    flex: 1,
    // justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  label: {
    fontSize: 18,
    color: "#007BFF",
    fontWeight: "bold",
  },
  input: {
    height: 50,
    borderColor: "#007BFF",
    borderWidth: 1,
    width: 300,
    marginBottom: 20,
    borderRadius: 25,
    paddingHorizontal: 15,
    backgroundColor: "#F0F0F0",
    fontSize: 16,
    color: "#333333",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  emailButton: {
    backgroundColor: "#7CDB8A",
    width: 300,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  buttonText: {
    color: "#FFFFFF", // White text for contrast
    fontSize: 18,
    fontWeight: "bold", // Bold text to make it stand out
  },
  wrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  button: {
    marginTop: 20,
    height: 50,
    width: 300,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#7CDB8A",
    shadowColor: "rgba(0,0,0,0.4)",
    shadowOffset: {
      width: 1,
      height: 5,
    },
    shadowOpacity: 0.34,
    shadowRadius: 6.27,
    elevation: 10,
  },

  welcome: {
    padding: 10,
    marginBottom: 10,
  },

  status: {
    padding: 20,
    marginBottom: 20,
    justifyContent: "center",
    alignItems: "center",
    color: "gray",
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

export default PaywallScreen;
