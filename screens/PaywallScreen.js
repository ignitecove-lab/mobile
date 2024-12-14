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
  Alert,
  TouchableOpacity,
  View,
  Image,
  FlatList,
  Linking,
  BackHandler,
  Keyboard
} from "react-native";
import { BottomSheetView, BottomSheetModal } from "@gorhom/bottom-sheet";
import { Colors } from "react-native/Libraries/NewAppScreen";
import PhoneInput from "react-native-phone-number-input";
import messaging from "@react-native-firebase/messaging";
import { useNavigation } from "@react-navigation/native";
import API_BASE_URL from "./../lib/constants/baseUrl";
import RadioButtonRN from "radio-buttons-react-native";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import Modal from "react-native-modal";
import useAuth from "../useAuth";
import {
  IAP, products, getProducts, initConnection, purchaseErrorListener,
  purchaseUpdatedListener, endConnection, finishTransaction, requestPurchase
} from "react-native-iap";

import {
  StripeProvider,
  PlatformPayButton,
  usePlatformPay,
  PlatformPay,
} from "@stripe/stripe-react-native";
const CLOSE_URL = `/v1/start-button/webhook/redirect`;
const ps_cancel_url = `${API_BASE_URL}/paystack/cancel`;
const ps_callback = `${API_BASE_URL}/v1/start-button/webhook/redirect`;
const items = Platform.select({
  ios: [],
  android: ["ignitecove_bronze_plan", "ignitecove_silver_plan"]
});
let purchaseUpdateItem;
let purchaseItemError;

const PurchasePlansScreen = ({ plans, setPlanId, setNext }) => {
  const { authState } = useAuth();

  const renderPlan = ({ item }) => (
    <View style={styles.planContainer}>
      <Text style={styles.planName}>{item.name}</Text>
      {item.planDetails &&
        item.planDetails.map(
          (price, index) =>
            price.currency === authState?.currency && (
              <Text key={index} style={styles.planPrice}>
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: price?.currency?.toString(),
                }).format(price.price)}
              </Text>
            )
        )}

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
  (
    { snapPoints = ["50%", "70%", "90%"], onChange, children, bottomView },
    ref
  ) => {
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

            <View style={styles.bottomViewContainer}>{bottomView}</View>
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
  const [canGoBack, setCanGoBack] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [codeError, setCodeError] = useState(null);
  const [modalText, setModalText] = useState("");
  const [planId, setPlanId] = useState(null);
  const [value, setValue] = useState("");
  const [plans, setPlans] = useState([]);
  const [next, setNext] = useState(false);
  const { isUpgrade, refreshScreen } = route.params;
  const bottomSheetRef = useRef(null);
  const webViewRef = useRef(null);
  const [gpName, setGpName] = useState(null);
  const [gpDescription, setGpDescription] = useState(null);
  const [gpLocalizedPrice, setGpLocalizedPrice] = useState(null);
  const [gpCurrency, setGpCurrency] = useState(null);

  const phoneInput = useRef(null);
  const navigation = useNavigation();

  const delay = (ms) => new Promise((res) => setTimeout(res, ms));

  const { fcmToken, authState, isVIP, authContext } =
    useAuth();
  const {
    isPlatformPaySupported,
    confirmPlatformPayPayment,
  } = usePlatformPay();
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

  const endTransaction = (() => {
    try {
      purchaseUpdateItem.remove();
    } catch (error) {
    }
    try {
      purchaseItemError.remove();
    } catch (error) {
    }
    try {
      endConnection();
    } catch (error) {
      console.log('Error removing listeners: ', error)
    }
  })

  useEffect(() => {
    fetchPlans().then(() => {
      initConnection().catch((e) => {
        Alert.alert("Google Pay\n" + e.message);
        console.warn("error initializing connection ", e);
      }).then(() => {
        getProducts({ skus: items }).catch((e) => {
          console.log("Error occurred", e)
        }).then((returnedProducts) => {
          console.log("From G-Pay: ", returnedProducts);
          const planToUse = isUpgrade ? 'bronze' : plans?.name?.toLocaleLowerCase?.() ?? 'silver';
          console.log("plan to use: ", planToUse);
          const product = returnedProducts.find(product => product.productId.includes(planToUse));
          console.log("returned chosen ", product);
          if (product) {
            setGpName(product.name);
            setGpDescription(product.description);
            setGpLocalizedPrice(product.localizedPrice)
            setGpCurrency(product.currency);
          }
        });
      })
    });

    const subscribeOnMessage = messaging().onMessage(async (remoteMessage) => {
      if (remoteMessage.notification?.body === "payment successful") {
        await authContext.updatePaywallState(false);
      }
    });

    purchaseItemError = purchaseErrorListener((error) => {
      console.log("Error purchasing item: ".error);
      if (!(error["responseCode"] === "2")) {
        Alert.alert(
          error.message
        );
      }
    });

    purchaseUpdateItem = purchaseUpdatedListener(
      async (purchase) => {
        console.log('purchase: ', purchase)
        const receipt = purchase.transactionReceipt;
        if (receipt) {
          let ackResult;
          try {
            if (Platform.OS === 'ios') {
              ackResult = await finishTransaction(purchase.transactionId);
            } else {
              ackResult = await finishTransaction({ purchase });
            }
            console.log('ack results: ', ackResult);
          } catch (ackErr) {
            Alert.alert("An error occurred");
            console.warn('ackErr', ackErr);
          }

          if (receipt?.purchaseState === "1") {
            const shouldNavigate = sendReceipts(receipt);

            if (shouldNavigate === true) {
              Alert.alert("Success");
              console.log("Receipt confirmed")
              navigation.navigate("PayStatus", {
                phoneNumber: formattedValue,
                refreshHomeScreen: refreshScreen ?? false
              })
              endTransaction();
            }
          }
        }
      },
    );
    // purchaseUpdateItem = purchaseUpdatedListener((purchase) => {
    //   const receipt = receipt ? JSON.parse(purchase.transactionReceipt) : null;
    //   console.log("receipt>>>>> ", receipt)
    //
    //   if (receipt) {
    //     const result = finishTransaction({purchase});
    //     console.log('confirm purchase : ', result)
    //     if(Platform.OS === 'android'){
    //       Alert.alert(result.message)
    //     }
    //   }
    //   if(receipt?.purchaseState === "1"){
    //     const shouldNavigate = sendReceipts(receipt);
    //
    //     if (shouldNavigate) {
    //       Alert.alert("Success");
    //       console.log("Receipt confirmed")
    //       navigation.navigate("PayStatus", {
    //         phoneNumber: formattedValue,
    //         refreshHomeScreen: refreshScreen ?? false
    //       })
    //       endTransaction();
    //     }}
    // });

    // App terminated message handling
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage?.notification?.body === "payment successful") {
          authContext.updatePaywallState(false);
          bottomSheetRef.current.dismiss();
          navigation.navigate("PayStatus", {
            phoneNumber: formattedValue,
            haveLoader: false,
            refreshHomeScreen: refreshScreen ?? false
          });
        }
      });
    // Add event listener for back button
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      handleBackPress
    );
    return () => {
      subscribeOnMessage();
      backHandler.remove();
      endTransaction();
    };
  }, [fcmToken, authContext]);
  const fetchPaymentIntentClientSecret = async () => {
    const data = JSON.stringify({
      email: `${authState?.user?.phoneNumber}@ignitecove.com`,
      currency: "USD",
      planId: parseInt(planId),
      FCMToken: fcmToken,
      referralCode: "",
    });
    const response = await fetch(`${API_BASE_URL}/v1/stripe/create-payment-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data

    });
    const { clientSecret } = await response.json();
    console.log(data)
    return clientSecret;
  };

  const sendReceipts = async (receipt) => {
    const data = JSON.stringify({
      receipt: receipt,
      planId: parseInt(planId),
      fcmToken: fcmToken,
      phoneNumber: `${authState?.user?.phoneNumber}`,
    });
    console.log("receipt data: ", data)
    const response = await fetch(`${API_BASE_URL}/v1/g-pay/receipt`, {
      method: 'POST',
      headers: {
        'Content-type': 'application/json'
      },
      body: data
    });
    const json = await response.json();
    console.log("receipt res: ", json)

    return response.ok && (json.status === 0)
  }

  const productIds = (() => {
    const planToUse = isUpgrade ? 'bronze' : plans?.name?.toLocaleLowerCase?.() ?? '';
    return planToUse.includes('bronze')
      ? 'ignitecove_bronze_plan'
      : 'ignitecove_silver_plan';
  })();

  const handleBuyProduct = async () => {
    const skus = [productIds];
    try {
      console.log(skus);
      await requestPurchase({ skus: skus });
      bottomSheetRef.current.dismiss();
    } catch (error) {
      handleError(error.message, 'handleBuyProduct');
    }
  };

  const handleError = (error, context) => {
    Alert.alert(error);
    console.log(
      'Exception while making Request',
      error,
    );
  };

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

      bottomSheetRef.current.dismiss();
      await navigation.navigate("PayStatus", {
        phoneNumber: formattedValue,
        refreshHomeScreen: refreshScreen ?? false
      });
      setModalVisible(false);
      return json;
    } catch (error) {
      setModalText("An error occurred while initiating payment");
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

  const start_button_currencies = [
    "NGN",
    "GHS",
    "ZAR",
    "UGX",
    "TZS",
    "RWF",
    // "USD",
    // "KES",
  ];

  let radioData = [];
  if (plans && plans?.length > 0 && authState?.currency === "KES") {
    radioData.push({
      label: (
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View style={{ width: 100, height: 50 }}>
            <Image
              source={require("../lipa_na_mpesa.png")}
              style={{ width: "100%", height: "100%", resizeMode: "contain" }}
            />
          </View>
          <Text style={{ marginLeft: 10 }}>
            {(() => {
              const targetCurrency = authState?.currency;
              const plan = plans?.find((plan) => plan?.id === planId);
              if (!plan) return "Plan not found";
              const planDetail = plan.planDetails.find(
                (detail) => detail.currency === targetCurrency
              );
              if (!planDetail) return "Price not available";

              return `Lipa na Mpesa ${new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: targetCurrency,
              }).format(planDetail.price)}`;
            })()}
          </Text>
        </View>
      ),
      value: "lipa_na_mpesa",
    });
  }

  {
    radioData.push({
      label: (
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View style={{ width: 100, height: 50 }}>
            <Image
              source={require("../google_pay.png")}
              style={{ width: "100%", height: "100%", resizeMode: "contain" }}
            />
          </View>
          <Text style={{ marginLeft: 10 }}>
            {(() => {
              return `Google Pay ${gpCurrency ?? ''} ${gpLocalizedPrice ?? ''}`;
            })()}
          </Text>
        </View>
      ),
      value: "pay_by_google",
    });
  }

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

  start_button_currencies.includes(authState?.currency) &&
    plans.length > 0 &&
    radioData.push({
      label: (
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View style={{ width: 100, height: 50 }}>
            <Image
              source={require("../start-button.png")}
              style={{ width: "100%", height: "100%", resizeMode: "contain" }}
            />
          </View>
          <Text style={{ marginLeft: 10 }}>
            {(() => {
              const targetCurrency = authState?.currency;
              const plan = plans?.find((plan) => plan?.id === planId);
              if (!plan) return "Plan not found";
              const planDetail = plan.planDetails.find(
                (detail) => detail.currency === targetCurrency
              );
              if (!planDetail) return "Price not available";

              return `Pay Now ${new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: targetCurrency,
              }).format(planDetail.price)}`;
            })()}
          </Text>
        </View>
      ),
      value: "pay_by_start_button",
    });

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

  const getStartButtonURL = async () => {
    const authURL = await fetch(`${API_BASE_URL}/v1/start-button/init-txn`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authState.userToken}`,
      },
      body: JSON.stringify({
        email: `${authState?.user?.phoneNumber}@ignitecove.com`,
        planId: parseInt(planId),
        currency: authState?.currency,
        FCMToken: fcmToken,
        referralCode,
      }),
    })
      .then(async (response) => {
        const data = await response.json();
        if (response.ok && data.status === 0) {
          return data.url;
        }
        throw new Error(data.message);
      })
      .catch((err) => {
        console.log("error", err.message);
      });

    if (authURL) {
      setAuthorizationUrl(authURL);
      setShowModal(true);
    }
  };

  const handleBackPress = () => {
    if (webViewRef.current && canGoBack && showModal) {
      webViewRef.current.goBack();
      setShowModal(false);
    }
  };

  const handleWebViewClosePress = () => {
    navigation.goBack();
  };

  const onNavigationStateChange = (state) => {
    const { url, canGoBack } = state;

    setCanGoBack(canGoBack);

    if (!url) return;

    if (containsPart(url, ps_callback)) {
      setShowModal(false);
      setAuthorizationUrl(null);
      setIsLoading(false);
      bottomSheetRef.current.dismiss();
      navigation.navigate("PayStatus", {
        phoneNumber: formattedValue,
        refreshHomeScreen: refreshScreen ?? false,
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
        refreshHomeScreen: refreshScreen ?? false
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

  const handlePaymentInquiry = () => {
    const subject = "Ignitecove Payment Inquiry";
    const recipient = "support@ignitecove.co.ke";
    const email = `mailto:${recipient}?subject=${encodeURIComponent(subject)}`;

    Linking.openURL(email).catch((err) => console.error("Error:", err));
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
            style={styles.switchPlans}
            onPress={() => {
              setNext(false);
              setPlanId(null);
              setPaymentMethod(null);
              handleClosePress();
            }}
          >
            <Ionicons name="arrow-down-circle-outline" size={24} color="black" />
            <Text style={styles.backButtonText}>Switch Plan</Text>
          </TouchableOpacity>

          {radioData.length > 0 ? (
            <RadioButtonRN
              data={radioData}
              selectedBtn={(e) => {
                setPaymentMethod(e.value);
                handleOpenSheet();
              }}
            />
          ) : (
            <Text style={styles.backButtonText}>
              No payment method available in your currency
            </Text>
          )}
        </>
      )}

      <View style={{ flex: 1 }}>
        <CustomBottomSheetModal
          ref={bottomSheetRef}
          bottomView={
            <View>
              <TouchableOpacity onPress={handlePaymentInquiry}>
                <Text>Click here to contact us for payment inquiries</Text>
              </TouchableOpacity>
            </View>
          }
        >
          {/*{plans &&*/}
          {/*  plans.length > 0 &&*/}
          {/*  plans?.find((obj) => obj.name === "BRONZE") && (*/}
          {/*    <View style={styles.welcome}>*/}
          {/*      <Text style={styles.referralLabel}>Referral Code</Text>*/}
          {/*      <TextInput*/}
          {/*        style={styles.referralInput}*/}
          {/*        placeholder="IGC-XXXX"*/}
          {/*        onChangeText={handleReferralCodeChange}*/}
          {/*      />*/}

          {/*      {codeError ? (*/}
          {/*        <Text style={styles.labelErrorText}>{codeError}</Text>*/}
          {/*      ) : null}*/}
          {/*    </View>*/}
          {/*  )}*/}

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

                  // Check if the user entered 9 digits, or 10 if the first digit is 0
                  if ((((text.length === 9) && !text.startsWith("0"))) || (text.length === 10 && text.startsWith("0"))) {
                    Keyboard.dismiss();
                  }
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

          {paymentMethod === "pay_by_start_button" && (
            <>
              <View style={{ width: 100, height: 50 }}>
                <Image
                  source={require("../start-button.png")}
                  style={{
                    width: "100%",
                    height: "100%",
                    resizeMode: "contain",
                  }}
                />
              </View>

              <TouchableOpacity
                style={styles.button}
                onPress={async () => await getStartButtonURL()}
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
                      ref={webViewRef}
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

                    <View style={styles.buttonContainer}>
                      <TouchableOpacity
                        onPress={handleBackPress}
                        disabled={!canGoBack}
                        style={[
                          styles.webviewbutton,
                          { backgroundColor: canGoBack ? "blue" : "gray" },
                        ]}
                      >
                        <Text style={styles.buttonText}>Back</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={handleWebViewClosePress}
                        style={[
                          styles.webviewbutton,
                          { backgroundColor: "red" },
                        ]}
                      >
                        <Text style={styles.buttonText}>Close</Text>
                      </TouchableOpacity>
                    </View>
                  </SafeAreaView>
                </Modal>
              )}
            </>
          )}


          {paymentMethod === "pay_by_google" && (
            <>
              <TouchableOpacity
                style={styles.button}
                onPress={async () => {
                  await handleBuyProduct();
                }}
              >
                <Text style={styles.buttonText}>Initiate Payment</Text>
              </TouchableOpacity>
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
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
  },
  webviewbutton: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 8,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  bottomViewContainer: {
    padding: 16,
    marginTop: 30,
  },
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
    padding: 8,
  },
  switchPlans: {
    marginLeft: 20,
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  backButtonText: {
    fontSize: 16,
    marginLeft: 8,
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
    shadowRadius: 8,
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
    marginBottom: 8,
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
      height: 8,
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