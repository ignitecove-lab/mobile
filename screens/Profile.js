import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import React, { useState, useEffect, useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import API_BASE_URL from "../lib/constants/baseUrl";
import { Ionicons } from "@expo/vector-icons";
import useAuth from "../useAuth";

const FeatureCard = ({ icon, color, title, subtitle }) => {
  return (
    <View style={styles.card}>
      <Ionicons name={icon} size={40} color={color} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
};

const FeatureSection = () => {
  return (
    <View style={styles.Infocontainer}>
      {/* <FeatureCard
        icon="star"
        title={`${Math.floor(Math.random() * 20) + 1} Likes`}
        subtitle=""
        color="#B026FF"
      />
      <FeatureCard
        icon="mail-unread"
        title="Messages"
        subtitle=""
        color="#603FEF"
      />
      <FeatureCard
        icon="flame"
        title="Viewed Numbers"
        subtitle="VIEW MORE"
        color="#ef4444"
      /> */}
    </View>
  );
};

const ProfileScreen = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);

  const { user, authState, isVIP, setIsVIP } = useAuth();
  const navigation = useNavigation();

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
                source={{ uri: userData.imageURL }}
                style={styles.profileImage}
              />

              <View style={styles.editIconContainer}>
                <Ionicons name="pencil" size={24} color="#000" />
              </View>
            </TouchableOpacity>

            <View style={styles.profileInfo}>
              <Text
                style={styles.profileName}
              >{`${userData.firstName}, ${userData.age}`}</Text>
            </View>
          </View>

          <FeatureSection />

          <View style={styles.premiumSection}>
            <Text style={styles.premiumText}>Ignitecove Premium</Text>
            <Text style={styles.premiumDetails}>
              {!isVIP ? `Upgrade and get seen and see premium users only` : `We are sorry to see you leave`}
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

const styles = StyleSheet.create({
  editIconContainer: {
    position: "absolute",
    top: 40,
    left: 180,
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
    padding: 6,
  },
  loading: {
    flex: 1,
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  Infocontainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 5,
  },
  card: {
    flex: 1,
    width: 100,
    height: 140,
    backgroundColor: "#f5f5f5",
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
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  profileHeader: {
    flexDirection: "column",
    alignItems: "center",
    padding: 16,
  },
  profileImage: {
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
    marginTop: 15,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "bold",
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
});

export default ProfileScreen;
