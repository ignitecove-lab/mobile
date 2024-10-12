import {
  StyleSheet,
  Text,
  View,
  Image,
  FlatList,
  TouchableOpacity,
} from "react-native";
import React, { useLayoutEffect, useEffect, useState } from "react";

const SearchResult = ({ route, navigation }) => {
  const [users, setUsers] = useState(route.params);

  //listing of users for the cards
  useEffect(() => {
    console.log(users);
    users;
  }, []);
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: "Search Result",
      headerStyle: {
        backgroundColor: "white",
      },
      headerTitleStyle: { color: "black" },
    });
  }, []);
  return (
    <FlatList
      enableEmptySections={true}
      data={users.data}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => {
        return (
          <View>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("Profile View", { user_id: item.id })
              }
            >
              <View style={styles.box}>
                <Image
                  style={styles.icon}
                  source={{
                    uri: "https://img.icons8.com/color/70/000000/filled-like.png",
                  }}
                />
                <Image style={styles.image} source={{ uri: item?.imageURL }} />
                <View style={styles.boxContent}>
                  <Text style={styles.title}>{item.firstName}</Text>
                  <Text style={styles.description}>{item.description}</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        );
      }}
    />
  );
};

const styles = StyleSheet.create({
  image: {
    width: 100,
    height: 100,
    borderRadius: 10,
  },
  icon: {
    width: 20,
    height: 20,
    alignSelf: "center",
    marginRight: 10,
    borderRadius: 10,
  },
  box: {
    padding: 20,
    marginLeft: 5,
    marginRight: 5,
    marginTop: 5,
    marginBottom: 5,
    backgroundColor: "white",
    flexDirection: "row",
    borderRadius: 10,
  },
  boxContent: {
    flex: 1,
    flexDirection: "column",
    alignItems: "flex-start",
    marginLeft: 10,
  },
  description: {
    fontSize: 15,
    color: "#646464",
  },
  title: {
    fontSize: 18,
    color: "#151515",
  },
});

export default SearchResult;
