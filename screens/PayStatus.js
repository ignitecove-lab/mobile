import { View, TouchableOpacity, Text } from "react-native";
import { useNavigation } from "@react-navigation/native";
import tw from "tailwind-rn";
import { AntDesign } from "@expo/vector-icons";
const PayStatus = ({route}) => {
  const navigation = useNavigation();
  const { redirectScreen } = route.params;

  return (
    <>
      <View style={tw("h-full items-center p-12 pt-40")}>
        <View style={tw("bg-white w-full p-6 rounded-lg items-center")}>
          <AntDesign name="check" size={24} color="green" />

          <Text style={tw("text-gray-800 text-xl font-medium mt-4")}>
            Payment Successful
          </Text>

          <Text style={tw("text-gray-600 text-center mt-2 w-56")}>
            You can now view 2 contacts to view.
          </Text>

          <TouchableOpacity
            onPress={() => {
              if(redirectScreen) {
                navigation.navigate("Modal");
              }else{
                navigation.navigate("Home", {fetchProfile: true});
              }
            }}
            style={tw("bg-indigo-600 w-full py-2 items-center rounded-md mt-6")}
          >
            <Text style={tw("text-white font-medium")}>
              Go back to Profiles
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
};

export default PayStatus;
