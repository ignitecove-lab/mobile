import React, {useLayoutEffect, useState } from "react";
import { SafeAreaView, StyleSheet, Button, Text } from "react-native";
import { OtpInput } from "react-native-otp-entry";
import useAuth from '../useAuth';


const Otp = ({ route, navigation }) => {
    const { phoneNumber, countryCode } = route.params;
    const [invalidCode, setInvalidCode] = useState(false);
    const {checkVerification} = useAuth();
  useLayoutEffect(() => {
      navigation.setOptions({
          headerShown: true,
          headerTitle: "Verification",
          headerStyle: {
              backgroundColor: "white",
          },
          headerTitleStyle: {color: "black"},
      });
  }, []);
    return (
      <SafeAreaView style={styles.wrapper}>
        <Text style={styles.prompt}>Enter code sent to you via WhatsApp™</Text>
        <Text style={styles.message}>
          {`Your phone (${phoneNumber}) will be used to protect your account each time you log in.`}
        </Text>
        <Button
          title="Edit Phone Number"
          onPress={() => navigation.replace("PhoneNumber")}
        />
        <OtpInput
          numberOfDigits={6}
          focusColor="green"
          focusStickBlinkingDuration={500}
          onTextChange={(text) => console.log(text)}
          onFilled={(text) => {
             checkVerification(phoneNumber, countryCode, text);
            console.log(`OTP is ${text}`)}}
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
      </SafeAreaView>
    );
  };

  const styles = StyleSheet.create({
    wrapper: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },

    underlineStyleBase: {
      width: 30,
      height: 45,
      borderWidth: 0,
      borderBottomWidth: 1,
      color: "black",
      fontSize: 20,
    },

    underlineStyleHighLighted: {
      borderColor: "#03DAC6",
    },

    prompt: {
      fontSize: 18,
      paddingHorizontal: 30,
      paddingBottom: 20,
      fontWeight: "bold",
    },

    message: {
      fontSize: 16,
      paddingHorizontal: 30,
      marginBottom: 20,
    },

    error: {
      color: "red",
    },
  container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
  },
  });

  export default Otp;
