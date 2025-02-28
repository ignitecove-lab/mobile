import {
  ActivityIndicator,
  BackHandler,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  AppState,
  Pressable,
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
import tw from "tailwind-rn";
import { AntDesign, Entypo, Ionicons, MaterialIcons } from "@expo/vector-icons";
import Swiper from "react-native-deck-swiper";
import Modal from "react-native-modal";
import { Dropdown } from "react-native-element-dropdown";
import CustomBottomSheetModal from "../components/BottomSheet";
import API_BASE_URL from "./../lib/constants/baseUrl";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import VIPBadge from "../vip_badge.png";
import noContentImage from '../assets/no-content.png'
import { Linking } from "react-native";
import FastImage from "@d11/react-native-fast-image";
import RNRestart from "react-native-restart";

import * as Location from "expo-location";
import ReusableModal from "./ReusableModal";

const HomeScreen = ({ route }) => {
  const navigation = useNavigation();
  const {
    user,
    authState,
    justLoggedIn,
    setJustLoggedIn,
    isVIP,
    setIsVIP,
    authContext,
  } = useAuth();
  const swipeRef = useRef(null);
  const [profiles, setProfiles] = useState([]);
  const [showPhoneNumUi, setShowPhoneNumUi] = useState({});
  const [liked, setLiked] = useState({});
  const [isModalVisible, setModalVisible] = useState(false);
  const [modalText, setModalText] = useState("");
  const [modalLoading, setModalLoading] = useState(true);
  const [exitModalVisible, setExitModalVisible] = useState(false);
  const [subscription, setSubscription] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [cardIndex, setCardIndex] = useState(page);
  const [loading, setLoading] = useState(false);
  const [ageRange, setAgeRange] = useState([18, 100]);
  const [deviceLocation, setDeviceLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [location, setLocation] = useState(null);
  const [currentLocationName, setCurrentLocationName] = useState(null)
  const delay = (ms) => new Promise((res) => setTimeout(res, ms));
  const appState = useRef(AppState.currentState);
  const bottomSheetRef = useRef(null);
  const { sendLikeDislike } = authContext;
  const [refreshScreen, setRefreshScreen] = useState(true);
  const [firstTimeLogin, setFirstTimeLogin] = useState(false);
  const [isImageLoading, setImageLoading] = useState(true);

  const handleOpenSheet = () => bottomSheetRef?.current?.present();
  const handleCloseSheet = () => bottomSheetRef?.current?.dismiss();

  const ageRanges = Array.from({ length: 100 - 18 + 1 }, (_, index) => {
    const value = 18 + index;
    return { label: value.toString(), value };
  });

  const deviceWidth = Dimensions.get("window").width;
  const deviceHeight = Dimensions.get("window").height;

  const checkLocationPermissions = async (minAge = null, maxAge = null, location = null) => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      setLocationError(
        "Permission to access location was denied. You need to enable location access to for us to give you a better experience. Enable Location access now to continue"
      );
    } else {
      let dev_location = await Location.getCurrentPositionAsync({});
      setDeviceLocation(dev_location);
      let longitude = dev_location?.coords?.longitude;
      let latitude = dev_location?.coords?.latitude;

      let response = await Location.reverseGeocodeAsync({
        latitude,
        longitude
      });
      let locationData = response[0];
      let address = `${locationData.city}, ${locationData.region}, ${locationData.country}`;

      let data = JSON.stringify({
        longitude: longitude,
        latitude: latitude,
        location: address
      });
      console.log(data)
      await fetch(`${API_BASE_URL}/v1/account/location`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + authState.userToken,
        },
        body: data,
      });
      if (refreshScreen) {
        listProfiles(minAge, maxAge, location);
        setRefreshScreen(false);
      }
      setLocationError(null);
    }
  };

  useEffect(() => {
    if (route.params?.firstTime !== undefined) {
      setFirstTimeLogin(route.params.firstTime ?? false)
    }
    if(firstTimeLogin) {
      RNRestart.Restart();
      setFirstTimeLogin(false)
    }
    if (!authState?.user?.firstName || !authState?.user?.gender || !authState?.user?.age) {
      navigation.navigate("Modal");
    }
    else if ((authState?.user?.paywall ?? true)) {
      navigation.navigate("Ignitecove");
    } else {
      checkLocationPermissions();
    }
  }, [page, listProfiles, authState]);

  const initializeSwiper = () => {
    swipeRef?.current?.forceUpdate();
  };

  const handleConfirmExit = () => {
    BackHandler.exitApp();
  };

  useFocusEffect(
    useCallback(() => {
      if (route.params?.fetchProfile !== undefined) {
        setRefreshScreen(route.params.fetchProfile ?? true)
      }

      initializeSwiper();
    }, [showPhoneNumUi, liked])
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: "Ignitecove",
      headerStyle: {
        backgroundColor: "white",
      },
      headerTitleStyle: { color: isVIP ? "#007bff" : "black" },
      headerRight: () => (
        <>
          <TouchableOpacity onPress={() => handleOpenSheet()}>
            <Ionicons
              name="options-outline"
              size={30}
              color="#000"
              style={{ marginRight: 10 }}
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate("MyProfile")}>
            <Image
              style={tw("h-10 w-10 rounded-full")}
              source={{
                uri: user?.imageURL
                  ? user?.imageURL?.startsWith("http://")
                    ? user?.imageURL?.replace("http://", "https://")
                    : user?.imageURL
                  : "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png",
              }}
            />
          </TouchableOpacity>
        </>
      ),
    });
  }, []);

  const onImageLoadStart = () => {
    setImageLoading(true);
  };

  const onImageLoadEnd = () => {
    setImageLoading(false);
  };


  const listProfiles = useCallback(
    async (minAge = null, maxAge = null, location = null) => {
      try {
        let url = `${API_BASE_URL}/v1/account/list/${user.id}?shuffle=${justLoggedIn}&page=${page}&size=${pageSize}`;

        if (ageRange[0] || minAge) {
          url = url + `&minAge=${ageRange[0]}`;
        }
        if (ageRange[1] || maxAge) {
          url = url + `&maxAge=${ageRange[1]}`;
        }
        if (location) {
          url = url + `&radius=${location}`;
        }
        if (deviceLocation) {
          url = url + `&longitude=${deviceLocation?.coords?.longitude}`
          url = url + `&latitude=${deviceLocation?.coords?.latitude}`
        }

        setLoading(true);
        await fetch(url, {
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
    },
    [page, ageRange]
  );

  const checkSubscription = async (id) => {
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

      setModalVisible(false);
      if (json.status === 0) {
        setSubscription(true);
      } else {
        setSubscription(false);
        navigation.navigate("PayWall", { isUpgrade: false, refreshScreen: false });
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

  const handleSheetChanges = useCallback(
    (index) => {
      if (index === -1) {
        checkLocationPermissions(ageRange[0], ageRange[1], location);
      }
    },
    [ageRange, location]
  );
  const handleLocationChange = (text) => {
    // Remove any non-numeric characters
    const numericValue = text.replace(/[^0-9]/g, '');

    // Convert to number and set the value if within range (0 to 500)
    if (numericValue !== '' && (parseInt(numericValue) <= 500)) {
      setLocation(numericValue);
    } else if (numericValue === '') {
      setLocation('');
    }
  };
  return (
    <View style={styles.homeContainer}>
      {!loading ? (
        profiles && profiles?.length > 0 ? (
          <>
            <View style={styles.homeContent}>
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
                      label: {
                        textAlign: "right",
                        color: "red",
                      },
                    },
                  },
                  right: {
                    title: "MATCH",
                    style: {
                      label: {
                        textAlign: "right",
                        color: "#4DED30",
                      },
                    },
                  },
                }}
                onSwiped={(index) => console.log(index)}
                onSwipedAll={async () => {
                  setPage((prevPage) => prevPage + 1)
                  listProfiles(ageRange[0], ageRange[1], location)
                }}
                renderCard={(card) => (
                  <View key={card.id} style={styles.homeCard}>
                    <View>
                      <FastImage
                        fallback={true}
                        onLoadEnd={onImageLoadEnd}
                        onLoadStart={onImageLoadStart}
                        style={styles.homeImage}
                        source={{
                          uri: card.imageURL,
                          priority: FastImage.priority.high,
                        }}
                        resizeMode={FastImage.resizeMode.cover}
                        defaultSource={require("../assets/no_profile.png")}
                        {
                        ...isImageLoading && (
                          <ActivityIndicator size="large" color="#7CDB8A" />
                        )
                        }
                      />

                    </View>

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
                        },
                        tw("absolute w-full px-6 py-2 bottom-0"),
                      ]}
                    >

                      <View style={[tw("flex-col justify-between")]}>
                        {/* like / dislike buttons */}
                        <View style={[tw("flex-row justify-between")]}>
                          <TouchableOpacity
                            onPress={() => {
                              sendLikeDislike(
                                card.id,
                                card.phoneNumber,
                                "dislike"
                              );
                              swipeRef.current.swipeLeft();
                            }}
                            disabled={
                              card?.liked ||
                              (card.id === liked.id && liked.newLikeStatus)
                            }
                            style={tw(
                              "items-center justify-center rounded-full p-2 "
                            )}
                          >
                            <AntDesign
                              name="dislike2"
                              size={28}
                              color={
                                card.id === liked.id && liked.newLikeStatus
                                  ? "gray"
                                  : "white"
                              }
                            />
                          </TouchableOpacity>

                          <View>
                            {card.liked ||
                              (card.id === liked.id && liked.newLikeStatus) ? (
                              <TouchableOpacity
                                disabled={true}
                                style={tw(
                                  "items-center justify-center rounded-full p-2 "
                                )}
                              >
                                <AntDesign
                                  name={"heart"}
                                  size={28}
                                  color="red"
                                />
                              </TouchableOpacity>
                            ) : (
                              <TouchableOpacity
                                onPress={() => {
                                  sendLikeDislike(
                                    card.id,
                                    card.phoneNumber,
                                    "like"
                                  );
                                  setLiked({
                                    newLikeStatus: true,
                                    id: card.id,
                                  });
                                }}
                                disabled={card?.liked}
                                style={tw(
                                  "items-center justify-center rounded-full p-2"
                                )}
                              >
                                <AntDesign
                                  name={card?.liked ? "heart" : "hearto"}
                                  size={28}
                                  color={card?.liked ? "red" : "white"}
                                />
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                        <View style={styles.cardData}>
                          <Text style={tw("text-lg text-white")}>
                            {card.firstName}, {card.age}
                          </Text>
                          {card.gender && card.genderPreference && (
                            <>
                              {/* Normalize gender and genderPreference directly in the JSX */}
                              {(() => {
                                const normalizedGender = card.gender
                                  .trim()
                                  .toLowerCase();
                                const normalizedGenderPreference =
                                  card.genderPreference.trim().toLowerCase();

                                if (
                                  normalizedGender ===
                                  normalizedGenderPreference
                                ) {
                                  return (
                                    <Text style={{ fontSize: 20 }}>🌈</Text>
                                  ); // Rainbow emoji
                                } else {
                                  return normalizedGender === "male" ? (
                                    <AntDesign
                                      name="man"
                                      size={18}
                                      color="white"
                                    /> // Man icon
                                  ) : (
                                    <AntDesign
                                      name="woman"
                                      size={18}
                                      color="white"
                                    /> // Woman icon
                                  );
                                }
                              })()}
                            </>
                          )}
                        </View>
                        <View>
                          <Text style={tw("text-sm text-white mb-2")}>
                            {card.location}. {card.likedBack && card.liked ? (
                              <Text>Matched 💕</Text>
                            ) : card.likedBack && !card.liked ? (
                              <Text>{card.firstName} liked you</Text>
                            ) : null}
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
                                  checkSubscription(card.id).then((r) => {
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
                      )}
                    </LinearGradient>
                  </View>
                )}
              />
            </View>
          </>
        ) : (
          <>
            {
              authState && !authState.isProfileComplete ? (
                <View style={styles.premiumSection}>
                  <Text style={styles.premiumText}>Incomplete Profile</Text>
                  <Text style={styles.premiumDetails}>
                    Your profile is not complete. Please update your profile to see
                    potential matches that awaits you! 😊
                  </Text>

                  <TouchableOpacity
                    style={styles.upgradeButton}
                    onPress={() => navigation.navigate("Modal")}
                  >
                    <Text style={styles.upgradeButtonText}>Complete Profile</Text>
                  </TouchableOpacity>
                </View>
              ) : authState && (authState?.user?.paywall ?? true) ? (
                <View style={styles.premiumSection}>
                  <Text style={styles.premiumText}>Payment</Text>
                  <Text style={styles.premiumDetails}>
                    You have not made any payment. Make payment, potential matches that await you! 😊
                  </Text>

                  <TouchableOpacity
                    style={styles.upgradeButton}
                    onPress={() => navigation.navigate("Ignitecove")}
                  >
                    <Text style={styles.upgradeButtonText}>Pay</Text>
                  </TouchableOpacity>
                </View>
              ) :
                locationError ? (
                  <View style={tw("bg-white h-2/3 justify-center items-center")}>
                    <MaterialIcons name="place" size={40} color="orange" />
                    <Text style={styles.errorText}>{locationError}</Text>
                    <TouchableOpacity
                      style={[styles.button, styles.applyButton]}
                      onPress={() => Linking.openSettings()}
                    >
                      <Text style={styles.settingsButtonText}>
                        Enable Location Access
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View
                    style={tw(
                      "relative h-2/3 rounded-xl justify-center items-center"
                    )}
                  >
                    <Text style={tw("font-bold pb-5")}>Refresh and discover more</Text>
                    <Image
                      style={tw("h-full w-full")}
                      height={100}
                      width={100}
                      source={noContentImage}
                    />
                    <TouchableOpacity
                      style={tw("h-12 w-full bg-blue-500 p-2 mt-6  w-3/4 rounded-lg justify-center items-center")}
                      onPress={() => {
                        listProfiles()
                      }}
                    >
                      <Text style={tw("text-white text-center")}>
                        Refresh
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
          </>
        )
      ) : (
        <View
          style={tw(
            "relative h-4/5 rounded-xl justify-center items-center"
          )}
        >
          <View style={styles.loading}>
            <ActivityIndicator size="large" color="#7CDB8A" />
          </View>
        </View>
      )}

      <CustomBottomSheetModal
        ref={bottomSheetRef}
        onChange={handleSheetChanges}
      >
        {/* age filter */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Age range</Text>
          <Text
            style={styles.sliderValue}
          >{`${ageRange[0]} - ${ageRange[1]}`}</Text>

          <View style={styles.sliderRow}>
            <Dropdown
              style={[tw("items-center pt-1"), styles.dropdown]}
              data={ageRanges}
              maxHeight={300}
              labelField="label"
              valueField="value"
              autoScroll={true}
              value={ageRange[0]}
              onChange={(item) =>
                setAgeRange((prevState) => [item.value, prevState[1]])
              }
            />

            <Text style={styles.longText}>-</Text>

            <Dropdown
              style={[tw("items-center pt-1"), styles.dropdown]}
              data={ageRanges}
              maxHeight={300}
              labelField="label"
              valueField="value"
              autoScroll={true}
              value={ageRange[1]}
              onChange={(item) =>
                setAgeRange((prevState) => [prevState[0], item.value])
              }
            />
          </View>
        </View>

        {/* location filter */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Distance (Max 500 KM)</Text>
          <Text style={styles.sliderValue}>{location}</Text>

          <View style={styles.sliderRow}>
            <TextInput
              value={location}
              onChangeText={handleLocationChange}
              keyboardType="numeric"
              style={styles.input}
              placeholder="Within radius of (Km)"
            />
          </View>
        </View>

        <View style={styles.filterBtnContainer}>
          <Pressable
            style={[styles.button, styles.clearButton]}
            onPress={() => {
              setLocation(null);
              setAgeRange([18, 100]);
              handleCloseSheet();
            }}
          >
            <Text style={styles.buttonTextClear}>Clear Filters</Text>
          </Pressable>
          <Pressable
            style={[styles.button, styles.applyButton]}
            onPress={() => {
              handleCloseSheet();
              listProfiles(ageRange[0], ageRange[1], location);
            }}
          >
            <Text style={styles.buttonText}>Apply Filters</Text>
          </Pressable>
        </View>
      </CustomBottomSheetModal>

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

      <ReusableModal
        isVisible={isModalVisible}
        onBackdropPress={() => setModalVisible(false)}
        deviceWidth={Dimensions.get("window").width}
        deviceHeight={Dimensions.get("window").height}
        headerText="Loading"
        bodyText="Your request is being processed."
        isLoading={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  homeContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  errorText: {
    color: "black",
    fontSize: 16,
    marginBottom: 10,
    textAlign: "center",
  },
  settingsButton: {
    backgroundColor: "#007BFF",
    padding: 10,
    borderRadius: 5,
  },
  settingsButtonText: {
    color: "white",
    fontSize: 16,
  },
  homeContainer: {
    width: "100%",
    justifyContent: "center",
  },
  // homeContent: {
  //   width: "100%",
  // },
  homeCard: {
    marginTop: -34,
    borderRadius: 16,
    height: "95%",
    width: "100%",
  },
  homeImage: {
    marginTop: 0,
    height: "100%",
    width: "100%",
    borderRadius: 16,
  },
  premiumSection: {
    padding: 16,
    backgroundColor: "#fc6a03",
    alignItems: "center",
    borderRadius: 20,
    margin: 10,
  },
  premiumText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
  },
  premiumDetails: {
    marginTop: 8,
    textAlign: "center",
    color: "#ffffff",
  },
  upgradeButton: {
    marginTop: 16,
    backgroundColor: "#007bff",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  upgradeButtonText: {
    color: "#ffffff",
  },
  longText: {
    fontSize: 40,
    width: 20,
    textAlign: "center",
  },
  dropdown: {
    height: 50,
    width: "45%",
    borderColor: "gray",
    borderWidth: 0.5,
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  filterBtnContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    padding: 16,
    gap: 16,
  },
  refreshButton: {
    minWidth: "120",
    paddingTop: 20,
    marginTop: 16,
    backgroundColor: "#007BFF",
    borderRadius: 16
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 16,
    minWidth: 120,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3, // For shadow on Android
    shadowColor: "#000", // For shadow on iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  clearButton: {
    backgroundColor: "#fff",
  },
  applyButton: {
    backgroundColor: "#007bff",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  buttonTextClear: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
  },
  section: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    marginLeft: 10,
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
  },
  sliderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  slider: {
    flex: 1,
    marginRight: 16,
  },
  sliderValue: {
    position: "absolute",
    right: 0,
    padding: 16,
    fontSize: 16,
    fontWeight: "bold",
  },
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
  cardData: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
});
export default HomeScreen;
