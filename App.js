import { NavigationContainer } from "@react-navigation/native";
import { MenuProvider } from "react-native-popup-menu";
import StackNavigator from "./StackNavigator";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "./useAuth";

export default function App() {
  return (
    <MenuProvider>
      <NavigationContainer>
        <AuthProvider>
          <StatusBar
            style="dark" // Options: "auto", "inverted", "light", "dark"
            backgroundColor="#ffffff"
            translucent={false}
            hidden={false}
          />
          <StackNavigator />
        </AuthProvider>
      </NavigationContainer>
    </MenuProvider>
  );
}
