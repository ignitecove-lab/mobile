import React, { useRef, useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors } from "react-native/Libraries/NewAppScreen";
import PhoneInput from "react-native-phone-number-input";
import { getCountry } from "react-native-localize";

import useAuth from "../useAuth";

const PhoneNumber = ({ navigation }) => {
  const [value, setValue] = useState("");
  const [formattedValue, setFormattedValue] = useState("");
  const [countryCode, setCountryCode] = useState("KE");
  const [currency, setCurrency] = useState("KES");
  const phoneInput = useRef(null);
  const { sendSmsVerification } = useAuth();

  return (
    <>
      <View style={styles.container}>
        <SafeAreaView style={styles.wrapper}>
          <View style={styles.welcome}>
            <Text>Welcome!</Text>
          </View>
          <PhoneInput
            ref={phoneInput}
            value={value}
            defaultCode={getCountry()}
            layout="first"
            onChangeFormattedText={(text) => {
              setFormattedValue(text);
            }}
            onChangeCountry={(country) => {
              // console.log(country);
              setCountryCode(country.cca2);
              setCurrency(country.currency);
            }}
            countryPickerProps={{ withAlphaFilter: true }}
            withShadow
            autoFocus
          />
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              let formattedPhoneNum =
                phoneInput.current?.getNumberAfterPossiblyEliminatingZero()
                  .formattedNumber;
              sendSmsVerification(formattedPhoneNum, countryCode);

              navigation.navigate("Otp", {
                phoneNumber: formattedPhoneNum,
                countryCode: countryCode,
                currency: currency,
              });
            }}
          >
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.lighter,
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
    borderRadius: 10,
    shadowOpacity: 0.34,
    shadowRadius: 6.27,
    elevation: 10,
  },

  buttonText: {
    color: "white",
    fontSize: 14,
  },

  welcome: {
    padding: 20,
  },

  status: {
    padding: 20,
    marginBottom: 20,
    justifyContent: "center",
    alignItems: "flex-start",
    color: "gray",
  },
});

export default PhoneNumber;
