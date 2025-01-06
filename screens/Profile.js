import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import React, {
  useLayoutEffect,
  useState,
  useEffect,
  useCallback,
  forwardRef,
  useRef,
} from "react";
import {
  Menu,
  MenuOptions,
  MenuOption,
  MenuTrigger,
} from "react-native-popup-menu";
import { BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useNavigation } from "@react-navigation/native";
import API_BASE_URL from "../lib/constants/baseUrl";
import { Ionicons } from "@expo/vector-icons";
import useAuth from "../useAuth";
import tw from "tailwind-rn";
import Modal from "react-native-modal";
import * as Clipboard from "expo-clipboard";

const ProfileScreen = () => {
  const [numberSheetURL, setNumberSheetURL] = useState(
    `${API_BASE_URL}/v1/account/paid`
  );
  const [exitModalVisible, setExitModalVisible] = useState(false);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const bottomSheetRef = useRef(null);
  const numberSheetRef = useRef(null);

  const { authContext, user, authState, isVIP, setIsVIP } = useAuth();
  const { logout } = authContext;
  const navigation = useNavigation();
  const deviceWidth = Dimensions.get("window").width;
  const deviceHeight = Dimensions.get("window").height;
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: "Profile",
      headerStyle: {
        backgroundColor: "white",
      },
      headerTitleStyle: { color: isVIP ? "#007bff" : "black" },

      headerRight: () => (
        <Menu>
          <MenuTrigger>
            <Icon name="more-vert" size={25} color="black" />
          </MenuTrigger>
          <MenuOptions>
            <MenuOption onSelect={() => setExitModalVisible(true)}>
              <Text style={{ padding: 10 }}>Logout</Text>
            </MenuOption>
          </MenuOptions>
        </Menu>
      ),
    });
  }, []);

  const fetchUser = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);

    await fetch(`${API_BASE_URL}/v1/account/get/${user?.id}`, {
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
        throw new Error(text.message);
      })
      .then((data) => {
        setUserData(data);
        // console.log("userData", data);
        setLoading(false);
      })
      .catch((err) => {
        console.log("fetchUser error", err);
      });
  }, []);

  const downgradeUser = async () => {
    await fetch(`${API_BASE_URL}/v1/account/premium?state=false`, {
      method: "PUT",
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
        console.log(text);
        throw new Error(text);
      })
      .then((data) => {
        setIsVIP(data?.premium ? true : false);
        setLoading(false);
      })
      .catch((err) => {
        console.log("downgrade error", err);
      });
  };

  const handleOpenSheet = () => bottomSheetRef?.current?.present();
  const handleCloseSheet = () => bottomSheetRef?.current?.dismiss();
  const openNumberSheet = () => numberSheetRef?.current?.present();
  const closeNumberSheet = () => numberSheetRef?.current?.dismiss();

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <ScrollView style={styles.container}>
      {!loading && userData ? (
        <>
          <View style={styles.profileHeader}>
            <TouchableOpacity onPress={() => navigation.navigate("Modal")}>
              <Image
                source={{
                  uri: userData?.imageURL
                     ? userData?.imageURL?.startsWith("http://")
                        ? userData?.imageURL?.replace("http://", "https://")
                        : userData?.imageURL
                     : "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png",
                }}
                style={styles.profileImage}
              />

                <View style={styles.editIconContainer}>
                  <Ionicons name="pencil" size={20} padding={4} color="#fff" />
                </View>
              </TouchableOpacity>
              <View style={styles.profileDetails}>
                <Text style={styles.profileName}>{`${
                   userData.firstName || ""
                }`}</Text>
                <Text style={styles.profileText}>{`${userData.age || ""}, ${
                   userData.gender || ""
                }`}</Text>
                <Text
                   style={styles.profileText}
                >{`${userData.phoneNumber}`}</Text>

              </View>
            </View>

            {/*Tags Section */}

            <View style={styles.profileTags}>
              {userData?.accountTags && userData?.accountTags.length > 0 && (
                 <View style={tw("p-4")}>
                   <Text style={tw("text-lg font-bold mb-2")}>Tags:</Text>
                   <View style={tw("flex-row flex-wrap")}>
                     {userData.accountTags?.map((tag, index) => (
                        <View
                           key={index}
                           style={tw("bg-blue-200 px-4 py-2 rounded-lg m-1")}
                        >
                          <Text style={tw("text-black font-bold")}>{tag.tag}</Text>
                        </View>
                     ))}
                   </View>
                 </View>
              )}
            </View>


          <FeatureSection
            handleOpenSheet={handleOpenSheet}
            openNumberSheet={openNumberSheet}
            userData={userData}
            setNumberSheetURL={setNumberSheetURL}
          />

          {/* Referrals bottom sheet */}
          <View style={{ flex: 1 }}>
            <CustomBottomSheetModal ref={bottomSheetRef}>
              <ReferralScreen
                handleCloseSheet={handleCloseSheet}
                userData={userData}
              />
            </CustomBottomSheetModal>
          </View>

          {/* viewed numbers bottom sheet */}
          <CustomBottomSheetModal ref={numberSheetRef}>
            <NumberSheet
              handleCloseSheet={closeNumberSheet}
              userData={userData}
              authState={authState}
              navigation={navigation}
              url={numberSheetURL}
            />
          </CustomBottomSheetModal>

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

              <Text style={styles.modalText}>Would you like to logout? </Text>

              <View style={tw("flex-row justify-center items-center")}>
                <TouchableOpacity
                  onPress={() => {
                    setExitModalVisible(false);
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
                    logout();
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

          <View style={styles.premiumSection}>
            <Text style={styles.premiumText}>Ignitecove Premium</Text>
            <Text style={styles.premiumDetails}>
              {!isVIP
                ? `Upgrade and get seen and see premium users only`
                : `We are sorry to see you leave`}
            </Text>
            {isVIP ? (
              <TouchableOpacity
                style={styles.upgradeButton}
                onPress={async () => await downgradeUser()}
              >
                <Text style={styles.upgradeButtonText}>Downgrade Now</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.upgradeButton}
                onPress={() =>
                  navigation.navigate("PayWall", { isUpgrade: true })
                }
              >
                <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
              </TouchableOpacity>
            )}
          </View>
        </>
      ) : (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#7CDB8A" />
        </View>
      )}
    </ScrollView>
  );
};

const FeatureCard = ({ icon, color, title, subtitle }) => {
  return (
    <View style={styles.card}>
      <Ionicons name={icon} size={30} color={color} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
};

const FeatureSection = ({
  handleOpenSheet,
  openNumberSheet,
  userData,
  setNumberSheetURL,
}) => {
  return (
     <View style={styles.actionContainer}>
       <Text style={tw("text-lg font-bold mb-2")}>Actions:</Text>
       <View style={styles.infoContainer}>
         <TouchableOpacity
            onPress={() => {
              setNumberSheetURL(`${API_BASE_URL}/v1/account/paid`);
              openNumberSheet();
            }}
         >
           <FeatureCard
              icon="flame"
              title="Viewed"
              subtitle={userData?.viewCount || 0}
              color="#ef4444"
           />
         </TouchableOpacity>

         <TouchableOpacity
            onPress={() => {
              setNumberSheetURL(`${API_BASE_URL}/v1/account/likes`);
              openNumberSheet();
            }}
         >
           <FeatureCard
              icon="heart"
              title="Likes"
              subtitle={userData?.likes || 0}
              color="#ef4444"
           />
         </TouchableOpacity>

         {userData && userData.role === "Marketer" && (
            <TouchableOpacity onPress={() => handleOpenSheet()}>
              <FeatureCard
                 icon="cash-outline"
                 title="Referrals"
                 subtitle=""
                 color="#ef4444"
              />
            </TouchableOpacity>
         )}
       </View>
     </View>
  );
};

const ReferralScreen = ({ handleCloseSheet, userData }) => {
  const copyToClipboard = async () =>
    await Clipboard.setStringAsync(userData?.referral?.referralCode);

  const styles = StyleSheet.create({
    backIcon: {
      marginBottom: 10,
    },
    title: {
      color: "#000",
      fontSize: 18,
      textAlign: "center",
    },
    subtitle: {
      color: "red",
      fontSize: 24,
      fontWeight: "normal",
      textAlign: "center",
      marginVertical: 10,
    },
    iconsContainer: {
      flexDirection: "row",
      justifyContent: "space-around",
      marginVertical: 10,
      padding: 5,
    },
    iconItem: {
      alignItems: "center",
    },
    iconText: {
      color: "#fff",
      textAlign: "center",
      marginTop: 10,
    },
    referralContainer: {
      backgroundColor: "#fff",
      borderRadius: 10,
      padding: 20,
      alignItems: "center",
    },
    referralLabel: {
      color: "#D8434E",
      fontSize: 14,
      marginBottom: 10,
    },
    referralCodeContainer: {
      borderWidth: 1,
      borderColor: "#D8434E",
      borderStyle: "dashed",
      borderRadius: 10,
      padding: 10,
      width: "100%",
      alignItems: "center",
    },
    referralCode: {
      color: "#D8434E",
      fontSize: 20,
      marginBottom: 5,
    },
    copyText: {
      color: "#5e5e5e",
    },
  });

  return (
    <>
      {userData && (
        <View style={styles.container}>
          <Ionicons
            name="close-outline"
            size={24}
            color="white"
            style={styles.backIcon}
            onPress={handleCloseSheet}
          />
          <Text style={styles.title}>Earn unlimited FREE money!</Text>
          <Text style={styles.subtitle}>1 Referral = 10%</Text>
          <View style={styles.iconsContainer}></View>

          <View>
            <Text
              style={{ color: "#000", textAlign: "center", marginBottom: 10 }}
            >
              Refer your Friend and each time they pay you earn 10% of what they
              pay
            </Text>
          </View>

          <View style={styles.referralContainer}>
            <Text style={styles.referralLabel}>REFERRAL CODE</Text>
            <TouchableOpacity
              style={styles.referralCodeContainer}
              onPress={copyToClipboard}
            >
              <Text style={styles.referralCode}>
                {userData?.referral?.referralCode}
              </Text>
              <Text style={styles.copyText}>Tap to copy</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.title, { marginTop: 20 }]}>My Referrals</Text>
          <Text style={styles.subtitle}>{userData?.referral?.count || 0}</Text>
        </View>
      )}
    </>
  );
};

const NumberSheet = ({
  handleCloseSheet,
  userData,
  authState,
  navigation,
  url,
}) => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#e4e4e4",
      padding: 5,
      position: "relative",
    },
    contentContainer: {
      backgroundColor: "#ffffff",
    },
    itemContainer: {
      padding: 10,
      marginVertical: 5,
      borderRadius: 8,
      backgroundColor: "#ffffff",
      flexDirection: "row",
      alignItems: "center",
    },
    closeIcon: {
      position: "absolute",
      top: 0,
      right: 5,
      zIndex: 1,
    },
    image: {
      width: 50,
      height: 50,
      borderRadius: 20,
      marginRight: 10,
    },
    textContainer: {
      flex: 1,
    },
    nameAge: {
      fontSize: 16,
      color: "#000",
    },
    number: {
      fontSize: 14,
      color: "#000",
    },
    loading: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
  });

  const fetchProfiles = useCallback(() => {
    setLoading(true);

    fetch(url, {
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
        throw new Error(text.message);
      })
      .then((data) => {
        setProfiles(data);
        setLoading(false);
      })
      .catch((err) => {
        console.log("fetchProfiles error", err);
      });
  }, []);

  const renderItem = useCallback(
    (item) => (
      <TouchableOpacity
        style={styles.itemContainer}
        onPress={() => handlePressItem(item)}
        key={item?.id}
      >
        <Image
          source={{
            uri: item?.imageURL
               ? item.imageURL.startsWith("http://")
                  ? item.imageURL.replace("http://", "https://")
                  : item.imageURL
               : "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png",

          }}
          style={styles.image}
        />
        <View style={styles.textContainer}>
          <Text style={styles.nameAge}>
            {item?.firstName}, {item?.age}
          </Text>
          <Text style={styles.number}>{item?.location}</Text>
          <Text style={styles.number}>{item?.phoneNumber}</Text>
        </View>
      </TouchableOpacity>
    ),
    []
  );

  const handlePressItem = (item) => {
    handleCloseSheet();
    navigation.navigate("Profile_View", { user_id: item?.id });
  };

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  return (
    <View style={styles.container}>
      {userData && !loading ? (
        <>
          <View style={{ marginBottom: 20 }}>
            <Ionicons
              name="close-outline"
              size={24}
              color="#000"
              style={styles.closeIcon}
              onPress={handleCloseSheet}
            />
          </View>
          {profiles && profiles.length > 0 && profiles.map(renderItem)}
        </>
      ) : (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#7CDB8A" />
        </View>
      )}
    </View>
  );
};

const CustomBottomSheetModal = forwardRef(
  ({ snapPoints = ["50%", "70%"], onChange, children }, ref) => {
    return (
      <View style={styles.container}>
        <BottomSheetModal
          ref={ref}
          snapPoints={snapPoints}
          onChange={onChange}
          enablePanDownToClose={true}
          backgroundStyle={{
            backgroundColor: "#e4e4e4",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.2,
            shadowRadius: 2,
            elevation: 5,
          }}
        >
          <BottomSheetScrollView
            style={styles.bottomContentContainer}
            refreshing={false}
          >
            {children}
          </BottomSheetScrollView>
        </BottomSheetModal>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  bottomContentContainer: {
    flex: 1,
  },
  editIconContainer: {
    position: "absolute",
    top: 80,
    left: 80,
    backgroundColor: "#007bff",
    borderRadius: 20,
    padding: 6,
  },
  loading: {
    flex: 1,
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  actionContainer : {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginHorizontal: 12,
    marginVertical: 12,
    padding: 16,
  },
  infoContainer: {
    flexDirection: "row",
    justifyContent: "start",
  },
  card: {
    height: 96,
    width: 96,
    backgroundColor: "#fff",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    position: "relative",
    marginHorizontal: 5,
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 10,
  },
  subtitle: {
    fontSize: 12,
    color: "#888",
    marginTop: 5,
  },
  profileTags: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginHorizontal: 12,
  },
   feature: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginHorizontal: 12,
  },

  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    marginVertical: 16,
    marginHorizontal: 12,
  },
  profileImage: {
    flex: 1,
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
    marginTop: 16,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "bold",
  },
  profileDetails: {
    marginHorizontal: 16,
    flex: 3,
  },
  profileText: {
    fontSize: 16,
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
});

export default ProfileScreen;
