import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Modal from 'react-native-modal';
import tw from "tailwind-rn";

const CustomModal = ({
  modalVisible,
  setModalVisible,
  headerText,
  bodyText,
  onProceed,
}) => {
  return (
    <Modal
      isVisible={modalVisible}
      animationType="slide"
      hasBackdrop={true}
      backdropColor={"#00000031"}
    >
      <View style={styles.modalBody}>
        <Text style={styles.modalTextHeader}>{headerText}</Text>

        <Text style={styles.modalText}>
          {bodyText}
        </Text>

        <Text style={styles.disclaimerText}>
          Once saved, this preference cannot be changed.
        </Text>

        <View style={tw("flex-row justify-center items-center")}>
          <TouchableOpacity
            onPress={() => setModalVisible(false)}
            style={tw("bg-indigo-600 mr-6 ml-6 w-1/3 items-center rounded-md mt-6")}
          >
            <Text style={tw("text-white py-2 px-2 font-medium")}>
              Cancel
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setModalVisible(false);
              onProceed(); // Call the onProceed function passed in props
            }}
            style={tw("bg-red-500 mr-6 ml-6 w-1/3 items-center rounded-md mt-6")}
          >
            <Text style={tw("text-white py-2 px-2 font-medium")}>
              Proceed
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBody: {
    flex: 1,
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 10,
    maxHeight: "35%",
    width: "98%",
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  modalTextHeader: {
    fontSize: 20,
    fontWeight: "bold",
  },
  modalText: {
    fontSize: 16,
    textAlign: "center",
    marginVertical: 24,
  },
  disclaimerText: {
    fontSize: 16,
    textAlign: "center",
    marginVertical: 12,
    color: "#ef4444",
  },
})

export default CustomModal;
