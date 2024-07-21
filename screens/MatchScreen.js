import { View, Text, Button, Image, TouchableOpacity } from 'react-native'
import React from 'react'
import { useNavigation } from '@react-navigation/native'
import tw from 'tailwind-rn';

const MatchScreen = () => {

    const navigation = useNavigation();
    const {params} = useRoute();

    const {loggedInProfile, userSwiped} = params;

  return (
    <View style={[tw("h-full bg-red-500 pt-20"), {opacity: 0.89}]}>
      <View style={tw("justify-center px-10 pt-20")}>
        <Image 
        style={tw("h-20 w-full")}
        source={{uri : "https://links.papareact.com/mg9"}} />
      </View>

      <View style={tw("flex-row justify-evenly mt-5")}>
        You and {userSwiped.displayName} have connected with each other
      </View>

      <View style={tw("flex-row justify-evenly mt-5")}>
        <Image 
            style={tw("h-32 w-32 rounded-full")}
            source={{
                uri : loggedInProfile.photoURL,
            }} />

        <Image 
            style={tw("h-32 w-32 rounded-full")}
            source={{
                uri : userSwiped.photoURL,
            }} />
      </View>

      <TouchableOpacity 
      style={tw("bg-white n-5 px-10 py-8 rounded-full mt-28")}
      onPress={ () => {
        navigation.goBack();
        navigation.navigate("Chat");
      }}
      >
            <Text style={tw("text-center")}>Send a Message</Text>
      </TouchableOpacity>

    </View>
  )
}

export default MatchScreen