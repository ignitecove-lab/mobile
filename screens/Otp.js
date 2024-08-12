import React, { useLayoutEffect, useState, useEffect, useRef } from "react";
import { SafeAreaView, StyleSheet, Text, View, Pressable } from "react-native";
import { OtpInput } from "react-native-otp-entry";
import useAuth from "../useAuth";

const Otp = ({ route, navigation }) => {
  const { phoneNumber, countryCode } = route.params;
  const [invalidCode, setInvalidCode] = useState(false);
  const [isTimerActive, setIsTimerActive] = useState(true);
  const [timeLeft, setTimeLeft] = useState(300);
  const { checkVerification, sendSmsVerification } = useAuth();

  const otpRef = useRef(null);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: "Verification",
      headerStyle: {
        backgroundColor: "white",
      },
      headerTitleStyle: { color: "black" },
    });
  }, [navigation]);

  useEffect(() => {
    let timer;
    if (isTimerActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsTimerActive(false);
    }
    return () => clearInterval(timer);
  }, [isTimerActive, timeLeft]);

  const handleResendOtp = () => {
    sendSmsVerification(phoneNumber, countryCode);
    setTimeLeft(300);
    setIsTimerActive(true);
    setInvalidCode(false);
    otpRef.clear;
  };

  return (
    <SafeAreaView style={styles.wrapper}>
      {/* Edit Number */}
      <View style={styles.editNumberContainer}>
        <Text style={styles.prompt}>
          Enter the code sent to you via WhatsApp™
        </Text>
        <Text style={styles.message}>
          {`Your phone (${phoneNumber}) will be used to protect your account each time you log in.`}
        </Text>

        <Pressable
          style={styles.editButton}
          onPress={() => navigation.replace("PhoneNumber")}
        >
          <Text style={styles.editButtonText}>Edit Phone Number</Text>
        </Pressable>
      </View>

      {/* OTP input */}
      <View style={styles.otpContainer}>
        <OtpInput
          numberOfDigits={6}
          focusColor="green"
          focusStickBlinkingDuration={500}
          onTextChange={(text) => console.log(text)}
          onFilled={async (text) => {
            const verify = await checkVerification(
              phoneNumber,
              countryCode,
              text
            );

            if (!verify) {
              setInvalidCode(true);
            } else {
              setInvalidCode(false);
            }
          }}
          textInputProps={{
            accessibilityLabel: "One-Time Password",
          }}
          theme={{
            containerStyle: styles.container,
            pinCodeContainerStyle: styles.pinCodeContainer,
            pinCodeTextStyle: styles.pinCodeText,
            focusStickStyle: styles.focusStick,
            focusedPinCodeContainerStyle: styles.activePinCodeContainer,
          }}
        />
      </View>

      {/* Invalid OTP message */}
      {invalidCode && (
        <Text style={styles.invalidCodeText}>
          The OTP you entered is invalid. Please try again.
        </Text>
      )}

      {/* resend OTP */}
      <View style={styles.timerContainer}>
        <Text style={styles.timerText}>
          {isTimerActive
            ? `Resend OTP in ${Math.floor(timeLeft / 60)}:${String(
                timeLeft % 60
              ).padStart(2, "0")}`
            : "You can resend OTP now."}
        </Text>

        <Pressable
          style={({ pressed }) => [
            styles.resendButton,
            {
              backgroundColor: pressed
                ? "#ddd"
                : isTimerActive
                ? "#ddd"
                : "#007bff",
            },
          ]}
          onPress={handleResendOtp}
          disabled={isTimerActive}
        >
          <Text style={styles.resendButtonText}>Resend OTP</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    alignItems: "center",
  },
  editNumberContainer: {
    alignItems: "center",
    marginBottom: 20,
    marginTop: 20,
    paddingHorizontal: 10,
  },
  prompt: {
    fontSize: 18,
    paddingBottom: 10,
    fontWeight: "bold",
  },
  message: {
    fontSize: 16,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  otpContainer: {
    width: "80%",
    marginTop: 40,
    marginBottom: 40,
  },
  timerContainer: {
    marginTop: 20,
    alignItems: "center",
    width: "80%",
  },
  timerText: {
    fontSize: 16,
    color: "gray",
    marginBottom: 10,
  },
  invalidCodeText: {
    color: "red",
    fontSize: 16,
    marginTop: 10,
  },
  resendButton: {
    padding: 10,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  resendButtonText: {
    color: "white",
    fontSize: 16,
  },
  editButton: {
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#007bff",
    marginTop: 10,
  },
  editButtonText: {
    color: "white",
    fontSize: 16,
  },
});

export default Otp;
