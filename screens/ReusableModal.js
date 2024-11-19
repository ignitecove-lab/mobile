import React from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import Modal from "react-native-modal";

const ReusableModal = ({
                          isVisible,
                          onBackdropPress,
                          deviceWidth,
                          deviceHeight,
                          backdropColor = "#00000031",
                          headerText = "Please wait",
                          bodyText = "",
                          isLoading = false,
                          customStyles = {}
                       }) => {
   return (
      <Modal
         style={[styles.modalContainer, customStyles.modalContainer]}
         isVisible={isVisible}
         hasBackdrop={true}
         deviceWidth={deviceWidth}
         deviceHeight={deviceHeight}
         backdropColor={backdropColor}
         onBackdropPress={onBackdropPress}
      >
         <View style={[styles.modalBody, customStyles.modalBody]}>
            <Text style={[styles.modalTextHeader, customStyles.modalTextHeader]}>
               {headerText}
            </Text>

            {isLoading && (
               <View style={[styles.loading, customStyles.loading]}>
                  <ActivityIndicator size="large" color="#7CDB8A" />
               </View>
            )}

            <Text style={[styles.modalText, customStyles.modalText]}>
               {bodyText}
            </Text>
         </View>
      </Modal>
   );
};

const styles = StyleSheet.create({
   modalContainer: {
      margin: 0,
      justifyContent: "center",
      alignItems: "center",
   },
   modalBody: {
      backgroundColor: "white",
      borderRadius: 10,
      padding: 20,
      alignItems: "center",
   },
   modalTextHeader: {
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 10,
   },
   modalText: {
      fontSize: 16,
      textAlign: "center",
      marginVertical: 10,
   },
   loading: {
      marginVertical: 20,
   },
});

export default ReusableModal;
