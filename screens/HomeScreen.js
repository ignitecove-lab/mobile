import {
  ActivityIndicator,
  BackHandler,
  Button,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  AppState,
} from "react-native";
import React, {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  useEffect,
} from "react";
import { useNavigation } from "@react-navigation/core";
import useAuth from "../useAuth";
import { SafeAreaView } from "react-native-safe-area-context";
import tw from "tailwind-rn";
import { AntDesign, Entypo, FontAwesome } from "@expo/vector-icons";
import Swiper from "react-native-deck-swiper";
import Modal from "react-native-modal";

import API_BASE_URL from "./../lib/constants/baseUrl";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import VIPBadge from "../vip_badge.png";

const HomeScreen = ({}) => {
  const navigation = useNavigation();
  const { user, authState, justLoggedIn, setJustLoggedIn, isVIP, setIsVIP } =
    useAuth();
  const swipeRef = useRef(null);
  const [profiles, setProfiles] = useState([]);
  const [showPhoneNumUi, setShowPhoneNumUi] = useState({});
  const [isModalVisible, setModalVisible] = useState(false);
  const [modalText, setModalText] = useState("");
  const [modalLoading, setModalLoading] = useState(true);
  const [exitModalVisible, setExitModalVisible] = useState(false);
  const [subscription, setSubscription] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [cardIndex, setCardIndex] = useState(page);
  const [loading, setLoading] = useState(false);
  const delay = (ms) => new Promise((res) => setTimeout(res, ms));
  const appState = useRef(AppState.currentState);

  const deviceWidth = Dimensions.get("window").width;
  const deviceHeight =
    Platform.OS === "ios"
      ? Dimensions.get("window").height
      : require("react-native-extra-dimensions-android").get(
          "REAL_WINDOW_HEIGHT"
        );

  useLayoutEffect(() => {
    if (!authState.isProfileComplete) {
      navigation.navigate("Modal");
    }
    listProfiles();
  }, []);

  const initializeSwiper = () => {
    swipeRef?.current?.forceUpdate();
  };

  const handleConfirmExit = () => {
    BackHandler.exitApp();
  };

  useFocusEffect(
    useCallback(() => {
      initializeSwiper();
    }, [showPhoneNumUi])
  );
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: isVIP ? "Ignitecove Pro" : "Ignitecove",
      headerStyle: {
        backgroundColor: "white",
      },
      headerTitleStyle: { color: isVIP ? "#007bff" : "black" },
      headerRight: () => (
        <TouchableOpacity onPress={() => navigation.navigate("MyProfile")}>
          <Image
            style={tw("h-10 w-10 rounded-full")}
            source={{ uri: user.imageURL }}
          />
        </TouchableOpacity>
      ),
    });
  }, []);
  useEffect(() => {
    const profileUpdate = AppState.addEventListener(
      "change",
      (nextAppState) => {
        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === "active"
        ) {
          console.log("App has come to the foreground home screen!");
          if (!authState.isProfileComplete) {
            console.log("profile not complete profileUpdate");
            navigation.navigate("Modal");
          }
        }

        appState.current = nextAppState;
      }
    );

    return () => {
      profileUpdate.remove();
    };
  }, []);

  const listProfiles = useCallback(async () => {
    try {
      console.log("current page", page);
      setLoading(true);
      console.log(
        `${API_BASE_URL}/v1/account/list/${user.id}?shuffle=${justLoggedIn}&page=${page}&size=${pageSize}`
      );
      await fetch(
        `${API_BASE_URL}/v1/account/list/${user.id}?shuffle=${justLoggedIn}&page=${page}&size=${pageSize}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + authState.userToken,
          },
        }
      )
        .then(async (response) => {
          if (response.ok) {
            return response.json();
          }
          const text = await response.json();
          throw new Error(text.error);
        })
        .then((data) => {
          console.log("available profiles", data.data.length);
          setProfiles(data.data);
          setJustLoggedIn(false);
          setCardIndex(cardIndex + 1);
        })
        .finally(() => setLoading(false));

      await fetch(`${API_BASE_URL}/v1/account/premium-status/${user.id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + authState.userToken,
        },
      })
        .then(async (response) => {
          if (response.ok) {
            return response.json();
          }
          const text = await response.json();
          throw new Error(text.error);
        })
        .then((data) => {
          setIsVIP(data?.data?.premium ? true : false);
        });
    } catch (error) {
      console.error("listProfiles method error: ", error.message);
      return false;
    }
  }, [page]);

  useEffect(() => {
    listProfiles();
  }, [page, listProfiles]);

  const checkSubscription = async (id, subToPhone) => {
    try {
      const data = JSON.stringify({
        subscriberId: user.id,
        subscribedToId: id,
      });

      setModalVisible(true);
      setModalText("Checking payment status ...");
      const response = await fetch(
        `${API_BASE_URL}/v1/account/subscribe/${user.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + authState.userToken,
          },
          body: data,
        }
      );
      const json = await response.json();

      if (json.status === 0) {
        setSubscription(true);
        setModalVisible(false);
      } else {
        setSubscription(false);
        setModalText(json.message);
        setModalVisible(false);
        navigation.navigate("PayWall", { isUpgrade: false });
      }
      return json;
    } catch (e) {
      console.error(e);
      setSubscription(false);
      setModalText("An error occurred while checking your payment status");
      delay(1000 * 2).then((r) => {
        setModalVisible(false);
      });
    }
  };

  return (
    <SafeAreaView style={tw("flex-1")}>
      <View style={tw("flex-row ")}></View>
      {!loading ? (
        profiles && profiles.length > 0 ? (
          <>
            <View style={tw("flex-1 z-0 -mt-8 ")}>
              <Swiper
                ref={swipeRef}
                containerStyle={{ backgroundColor: "transparent" }}
                cards={profiles}
                key={cardIndex}
                stackSize={2}
                cardIndex={0}
                animateCardOpacity
                verticalSwipe={false}
                overlayLabels={{
                  left: {
                    title: "NOPE",
                    style: {
                      labale: {
                        textAlign: "right",
                        color: "red",
                      },
                    },
                  },
                  right: {
                    title: "MATCH",
                    style: {
                      labale: {
                        textAlign: "right",
                        color: "#4DED30",
                      },
                    },
                  },
                }}
                onSwiped={(index) => console.log(index)}
                onSwipedAll={async () => setPage((prevPage) => prevPage + 1)}
                renderCard={(card) => (
                  <View
                    key={card.id}
                    style={tw("relative bg-white h-5/6 rounded-xl")}
                  >
                    <Image
                      style={tw("absolute top-0 h-full w-full rounded-xl")}
                      source={{ uri: card.imageURL }}
                    />

                    {card?.premium && (
                      <Image
                        source={VIPBadge}
                        style={{
                          position: "absolute",
                          top: 0,
                          right: 0,
                          width: 70,
                          height: 70,
                          overflow: "hidden",
                          borderRadius: 8,
                          borderTopRightRadius: 9,
                        }}
                      />
                    )}

                    <LinearGradient
                      colors={["rgba(0, 0, 0, 0.5)", "rgba(0, 0, 0, 0.5)"]}
                      style={[
                        {
                          flex: 1,
                          borderBottomLeftRadius: 12,
                          borderBottomRightRadius: 12,
                          maxHeight: 180,
                        },
                        tw("absolute w-full px-6 py-2 bottom-0"),
                      ]}
                    >
                      <View style={[tw("flex-col justify-between")]}>
                        <View>
                          <Text style={tw("text-lg text-white")}>
                            {card.firstName}, {card.age}{" "}
                          </Text>
                        </View>
                        <View>
                          <Text style={tw("text-sm text-white mb-2")}>
                            {card.location}
                          </Text>
                        </View>

                        <View style={tw("flex flex-row flex-wrap")}>
                          {card.phoneNumberVisible ||
                          (showPhoneNumUi.id === card.id &&
                            showPhoneNumUi.visible) ? (
                            <View style={tw("flex-1")}>
                              <Text
                                selectable={true}
                                style={tw("text-lg text-white")}
                                numberOfLines={1}
                                ellipsizeMode="tail"
                              >
                                {card.phoneNumber}
                              </Text>
                            </View>
                          ) : (
                            <View style={tw("flex-1")}>
                              <TouchableOpacity
                                style={tw("rounded-md bg-red-500 p-2")}
                                onPress={() => {
                                  setShowPhoneNumUi({});
                                  checkSubscription(
                                    card.id,
                                    card.phoneNumber
                                  ).then((r) => {
                                    if (r.status === 0) {
                                      setShowPhoneNumUi({
                                        id: card.id,
                                        visible: true,
                                      });
                                    } else {
                                      setShowPhoneNumUi({});
                                    }
                                  });
                                }}
                              >
                                <Text style={tw("text-white text-center")}>
                                  View Phone Number
                                </Text>
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>
                      </View>

                      {card.accountTags && (
                        <ScrollView
                          style={{
                            flex: 1,
                            maxHeight: 180,
                          }} // Set the maxHeight for the ScrollView
                        >
                          <View
                            style={tw(
                              "flex-row justify-center items-center w-full flex-wrap mt-2"
                            )}
                          >
                            {card.accountTags?.map((tag) => (
                              <TouchableOpacity
                                key={tag.tagId}
                                style={[
                                  styles.tag,
                                  {
                                    paddingVertical: 2,
                                    paddingHorizontal: 12,
                                    borderRadius: 4,
                                    borderWidth: 0.5,
                                    borderColor: "white",
                                    backgroundColor: user.accountTags?.some(
                                      (accountTag) =>
                                        accountTag.tagId === tag.tagId
                                    ),
                                  },
                                ]}
                              >
                                <Text style={styles.tagText}>{tag.tag}</Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </ScrollView>
                      )}
                    </LinearGradient>
                  </View>
                )}
              />
            </View>

            <View style={tw("flex flex-row justify-evenly mb-4")}>
              <TouchableOpacity
                onPress={() => {
                  swipeRef.current.swipeLeft();
                  setShowPhoneNumUi({});
                }}
                style={tw(
                  "items-center justify-center rounded-full w-14 h-14  bg-white"
                )}
              >
                <Entypo name="cross" size={24} color="red" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate("Search")}
                style={tw(
                  "items-center justify-center rounded-full w-14 h-14  bg-white"
                )}
              >
                <FontAwesome name="search" size={24} color="blue" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  swipeRef.current.swipeRight();
                  setShowPhoneNumUi({});
                }}
                style={tw(
                  "items-center justify-center rounded-full w-14 h-14 bg-white"
                )}
              >
                <AntDesign name="heart" size={24} color="green" />
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View
            style={tw(
              "relative bg-white h-2/3 rounded-xl justify-center items-center"
            )}
          >
            <Text style={tw("font-bold pb-5")}> No More Profiles </Text>
            <Image
              style={tw("h-20 w-full")}
              height={100}
              width={100}
              source={{ uri: "https://links.papareact.com/6gb" }}
            />
          </View>
        )
      ) : (
        <View
          style={tw(
            "relative bg-white h-4/5 rounded-xl justify-center items-center"
          )}
        >
          <Text style={tw("font-bold pb-5")}>
            Hang in there as we fetch Profiles!
          </Text>
          <View style={styles.loading}>
            <ActivityIndicator size="large" color="#7CDB8A" />
          </View>
        </View>
      )}

      {/*modal to logout*/}

      <Modal
        style={styles.modalContainer}
        isVisible={exitModalVisible}
        hasBackdrop={true}
        deviceWidth={deviceWidth}
        deviceHeight={deviceHeight}
        backdropColor={"#00000031"}
      >
        <View style={styles.modalBody}>
          <Text style={styles.modalTextHeader}>Exit</Text>

          <Text style={styles.modalText}>Would you like to exit the app? </Text>

          <View style={tw("flex-row justify-center items-center")}>
            <TouchableOpacity
              onPress={() => {
                setModalVisible(false);
              }}
              style={tw(
                "bg-indigo-600 mr-6 ml-6 w-1/3 items-center rounded-md mt-6"
              )}
            >
              <Text
                onPress={() => {
                  setExitModalVisible(false);
                }}
                style={tw("text-white py-2 px-2  font-medium")}
              >
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                //     close the app
                setExitModalVisible(false);
                handleConfirmExit();
              }}
              style={tw(
                "bg-red-500 mr-6 ml-6 w-1/3 items-center rounded-md mt-6"
              )}
            >
              <Text style={tw("text-white py-2 px-2 font-medium")}>
                Proceed
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        style={styles.modalContainer}
        isVisible={isModalVisible}
        hasBackdrop={true}
        deviceWidth={deviceWidth}
        deviceHeight={deviceHeight}
        backdropColor={"#00000031"}
      >
        <View style={styles.modalBody}>
          <Text style={styles.modalTextHeader}>Please wait</Text>

          {modalLoading ? (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color="#7CDB8A" />
            </View>
          ) : null}

          <Text style={styles.modalText}>{modalText}</Text>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    position: "absolute",
    bottom: 0,
  },
  tag: {
    borderRadius: 15,
    padding: 6,
    margin: 4,
  },
  tagText: {
    color: "white",
  },
  modalContainer: {
    flex: 1,
    alignItems: "center",
  },
  modalBody: {
    flex: 1,
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 10,
    maxHeight: "30%",
    width: "98%",
  },
  modalTextHeader: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 10,
  },
  loading: {
    justifyContent: "center",
    alignItems: "center",
  },
});

export default HomeScreen;
