// OTPInput.js
import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet } from 'react-native';

const OTPInput = ({ onVerify }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isButtonEnabled, setIsButtonEnabled] = useState(false);

  const handleChange = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    setIsButtonEnabled(newOtp.every(digit => digit.length === 1));
  };

  const handleVerify = () => {
    if (isButtonEnabled) {
      onVerify(otp.join(''));
    }
  };

  return (
    <View style={styles.container}>
      {otp.map((digit, index) => (
        <TextInput
          key={index}
          style={styles.input}
          value={digit}
          onChangeText={(text) => handleChange(text, index)}
          maxLength={1}
          keyboardType="numeric"
        />
      ))}
      <Button
        title="Verify"
        onPress={handleVerify}
        disabled={!isButtonEnabled}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    width: 40,
    height: 40,
    textAlign: 'center',
  },
});

export default OTPInput;
