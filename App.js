import { GestureHandlerRootView } from "react-native-gesture-handler";
import { NavigationContainer } from "@react-navigation/native";
import { MenuProvider } from "react-native-popup-menu";
import StackNavigator from "./StackNavigator";
import { StatusBar } from "expo-status-bar";
import { I18nManager } from "react-native";
import { AuthProvider } from "./useAuth";
import * as Linking from "expo-linking";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";

I18nManager.forceRTL(false);
I18nManager.allowRTL(false);
const prefix = Linking.createURL("/");

export default function App() {
  const linking = {
    prefixes: [prefix],
    // config: {
    //   screens: {
    //     Profile_View: "Profile_View/:user_id",
    //   },
    // },
  };

  return (
    <GestureHandlerRootView>
      <MenuProvider>
        <BottomSheetModalProvider>
          <NavigationContainer linking={linking}>
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
        </BottomSheetModalProvider>
      </MenuProvider>
    </GestureHandlerRootView>
  );
}
