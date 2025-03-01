import React, {useState, useCallback, useLayoutEffect, useEffect} from "react";
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from "react-native";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import { debounce } from "lodash";
import API_BASE_URL from "../lib/constants/baseUrl";
import useAuth from "../useAuth";
import RNRestart from "react-native-restart";

const GooglePlacesSearchScreen = ({ navigation }) => {
   const [searchText, setSearchText] = useState("");
   const [selectedLocation, setSelectedLocation] = useState(null);
   const [currentLocation, setCurrentLocation] = useState(null);
   const { authContext, user, authState } = useAuth();


   const handleSearch = useCallback(
      debounce((text) => {
         setSearchText(text);
      }, 500),
      []
   );
   useLayoutEffect(() => {
      navigation.setOptions({
         headerShown: true,
         headerTitle: "Update Location",
         headerStyle: {
            backgroundColor: "white",
         },
         headerTitleStyle: "black",
      });
   }, []);

   useEffect(() => {
      if(user?.portLocation) {
         setCurrentLocation(user?.portLocation);
      }
   }, []);

   const updatePortLocation = async (searchText) => {
      const data = JSON.stringify({ portLocation: searchText || "" });
      console.log(data);

      try {
         const response = await fetch(`${API_BASE_URL}/v1/account/port-location`, {
            method: "PUT",
            headers: {
               "Content-Type": "application/json",
               Authorization: "Bearer " + authState.userToken,
            },
            body: data,
         });
         const json = await response.json();

         // Handle restart if the status indicates success
         if (json.status === 0) {
            RNRestart.Restart();
         }
      } catch (error) {
         console.error("Error updating port location:", error);
      }
   };


   return (
      <View style={styles.container}>
         <GooglePlacesAutocomplete
            placeholder="Search"
            onPress={(data, details = null) => {
               setSelectedLocation(data.description);
               console.log("Selected Place: ", data, details);
            }}
            query={{ key: "AIzaSyBy61yd9aWrx4XhVvsujA_4aSA_sDINB_s", language: "en" }}
            debounce={400}
            styles={{
               textInput: styles.input,
            }}
            onChangeText={handleSearch}
         />
         <Text style={styles.warningText}>
            You are about to port to a different location. The selected location will be treated as your current location.
         </Text>

         {selectedLocation && (
            <Text style={styles.selectedLocationText}>
               Selected Location: {selectedLocation}
            </Text>
            )}
         {currentLocation && (
            <Text style={styles.selectedLocationText}>
               Current Location: {currentLocation}
            </Text>
         )}

         <View style={styles.buttonContainer}>
            <TouchableOpacity
               style={[styles.button, styles.clearButton]}
               onPress={() => {
                  setSearchText("");
                  updatePortLocation(searchText);
               }}
            >
               <Text>Clear</Text>
            </TouchableOpacity>

            <TouchableOpacity
               style={[styles.button, styles.applyButton]}
               onPress={() => {
                  updatePortLocation(selectedLocation);
               }}
            >
               <Text style={{ color: "#fff" }}>Save</Text>
            </TouchableOpacity>
         </View>
      </View>
   );
};

const styles = StyleSheet.create({
   container: {
      flex: 1,
      padding: 16,
      backgroundColor: "#f8f9fa",
   },
   warningText: {
      fontSize: 16,
      color: "#d9534f",
      marginBottom: 10,
      textAlign: "center",
   },
   selectedLocationText: {
      fontSize: 16,
      color: "#333",
      marginBottom: 10,
      textAlign: "center",
      fontWeight: "bold",
   },
   input: {
      height: 50,
      borderColor: "#ddd",
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 10,
      backgroundColor: "#fff",
   },
   buttonContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 20,
   },
   button: {
      paddingVertical: 12,
      marginHorizontal: 16,
      borderRadius: 16,
      minWidth: 120,
      alignItems: "center",
      justifyContent: "center",
      elevation: 3,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
   },
   clearButton: {
      flex: 1,
      backgroundColor: "#fff",
   },
   applyButton: {
      flex: 1,
      backgroundColor: "#007bff",
   },
});

export default GooglePlacesSearchScreen;
