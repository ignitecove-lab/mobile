import {
    StyleSheet,
    Text,
    View,
    Image,
    TextInput,
    TouchableOpacity,
} from "react-native";
import {AntDesign, FontAwesome} from "@expo/vector-icons";
import {Dropdown} from "react-native-element-dropdown";
import React, {useState} from "react";
import useAuth from "../useAuth";
import {useNavigation} from "@react-navigation/core";
import tw from "tailwind-rn";
import {SafeAreaView} from "react-native-safe-area-context";
import API_BASE_URL from "./../lib/constants/baseUrl";

const data = [
    {label: "Nairobi", value: "Nairobi"},
    {label: "Nakuru", value: "Nakuru"},
    {label: "Mombasa", value: "Mombasa"},
    {label: "Kisumu", value: "Kisumu"},
    {label: "Naivasha", value: "Naivasha"},
    {label: "Malindi", value: "Malindi"},
    {label: "Kilifi", value: "Kilifi"},
    {label: "Kiambu", value: "Kiambu"},
];

const SearchScreen = () => {
    const [value, setValue] = useState(null);
    const [isFocus, setIsFocus] = useState(false);
    const {user, authContext, authState} = useAuth();
    const {logout} = authContext;
    const navigation = useNavigation();
    const [age, setAge] = useState(null);
    const [users, setUsers] = useState([]);

    const searchProfiles = async (location, age) => {
        try {

            // create a searchbody object and only add age if it is not null
            let searchBody = {
                location: location,
            };
            if (age) {
                searchBody.age = parseInt(age);
            }

            const response = await fetch(
                `${API_BASE_URL}/v1/account/search`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${authState.userToken}`,
                    },
                    body: JSON.stringify(searchBody),
                },
            );

            let json = await response.json();
            setUsers(json);
            return json;
        } catch (error) {
            console.error("searchProfiles error ", error);
            return false;
        }
    };

    return (
        <SafeAreaView style={tw("flex-1")}>

            <View style={tw("h-full items-center p-12 pt-40")}>
                <Text style={tw("text-xl font-semibold text-red-500 p-4")}>
                    Profile Search
                </Text>

                <Text style={tw("text-center p-4 font-bold text-red-400")}>
                    Step 1: Select Location{" "}
                </Text>
                <Dropdown
                    style={[
                        tw("items-center pt-1"),
                        styles.dropdown,
                        isFocus && {borderColor: "red"},
                    ]}
                    data={data}
                    search
                    maxHeight={300}
                    labelField="label"
                    valueField="value"
                    placeholder={!isFocus ? "Select Location" : "..."}
                    searchPlaceholder="Search..."
                    value={value}
                    onFocus={() => setIsFocus(true)}
                    onBlur={() => setIsFocus(false)}
                    onChange={(item) => {
                        setValue(item.value);
                        setIsFocus(false);
                    }}
                    renderLeftIcon={() => (
                        <AntDesign
                            style={styles.icon}
                            color={isFocus ? "red" : "blue"}
                            name="Safety"
                            size={20}
                        />
                    )}
                />

                <Text style={tw("text-center p-4 font-bold text-red-400")}>
                    Step 2: Enter Age
                </Text>

                <TextInput
                    value={age}
                    onChangeText={setAge}
                    style={tw("text-xl font-semibold text-gray-500 p-2")}
                    keyboardType="numeric"
                    maxLength={2}
                    placeholder="Enter Age"
                />

                <TouchableOpacity
                    style={[tw("w-64 p-3 rounded-xl"), tw("bg-red-400")]}
                    onPress={() => {
                        searchProfiles(value, age).then(() => {
                            navigation.navigate("SearchResult", {data: users});
                        });
                    }}
                >
                    <Text style={tw("text-center items-center text-white text-xl ")}>
                        Search Profiles
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: "white",
        padding: 16,
    },
    dropdown: {
        height: 50,
        borderColor: "gray",
        borderWidth: 0.5,
        borderRadius: 8,
        paddingHorizontal: 8,
    },
    icon: {
        marginRight: 5,
    },
    label: {
        position: "absolute",
        backgroundColor: "white",
        left: 22,
        top: 8,
        zIndex: 999,
        paddingHorizontal: 8,
        fontSize: 14,
    },
    placeholderStyle: {
        fontSize: 16,
    },
    selectedTextStyle: {
        fontSize: 16,
    },
    iconStyle: {
        width: 20,
        height: 20,
    },
    inputSearchStyle: {
        height: 40,
        fontSize: 16,
    },
});

export default SearchScreen;
