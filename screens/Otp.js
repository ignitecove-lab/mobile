import React, {useLayoutEffect, useState } from "react";
import { SafeAreaView, StyleSheet, Button, Text } from "react-native";
import OTPInputView from "@twotalltotems/react-native-otp-input";
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
        <OTPInputView
          style={{ width: "80%", height: 200 }}
          pinCount={6}
          autoFocusOnLoad={true}
          codeInputFieldStyle={styles.underlineStyleBase}
          codeInputHighlightStyle={styles.underlineStyleHighLighted}
          onCodeFilled={(code) => {
            checkVerification(phoneNumber, countryCode, code);
          }}
        />
        {invalidCode && <Text style={styles.error}>Incorrect code.</Text>}
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
  });

  export default Otp;
