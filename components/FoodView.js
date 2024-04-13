import React, { useState } from "react";
import {
  Text,
  View,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  ScrollView,
  Linking,
} from "react-native";
import { Image } from "expo-image";
import Carousel from "react-native-reanimated-carousel";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { NavigationContainer } from "@react-navigation/native";
import Modal from "react-native-modal";
import { TextInput, Button } from "react-native-paper";
import Markdown from "react-native-markdown-display";
import { MaterialCommunityIcons } from "@expo/vector-icons";
// Extend String prototype to truncate text
String.prototype.truncate =
  String.prototype.truncate ||
  function (n, useWordBoundary) {
    if (this.length <= n) {
      return this;
    }
    const subString = this.slice(0, n - 1);
    return (
      (useWordBoundary
        ? subString.slice(0, subString.lastIndexOf(" "))
        : subString) + "..."
    );
  };

// GoogleGenerativeAI module
const { GoogleGenerativeAI } = require("@google/generative-ai");
const themeColor = "rgb(250, 245, 250)";

export default function FoodView({ foods, setFoods, triggerOut }) {
  // Google Generative AI setup
  const genAI = new GoogleGenerativeAI(process.env.EXPO_PUBLIC_GENAICOOKIE);
  const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });

  // State variables
  const [prompt, setPrompt] = useState("");
  const [chatResponse, setResponse] = useState("");
  const [modalVisibility, toggleModalVisibility] = useState(false);
  const [itemSelected, setSelectedItem] = useState(foods[0]);
  const [cMounted, mountC] = useState(true);

  const Tab = createMaterialTopTabNavigator();

  // toggles modal
  const toggleModal = () => {
    toggleModalVisibility(!modalVisibility);
  };
  // Function to render each food item
  const foodRender = ({ item }) => {
    let backCount = 0;
    let backTimer;

    return (
      <View style={styles.itemContainer}>
        <TouchableWithoutFeedback
          onPress={() => {
            backCount++;
            if (backCount == 2) {
              clearTimeout(backTimer);
              Alert.alert("Would you like to delete this item?", "", [
                { text: "Cancel" },
                {
                  text: "Delete",
                  onPress: () => {
                    let fList = foods;
                    for (var i = 0; i < foods.length; i++) {
                      if (foods[i].key == itemSelected.key) {
                        fList.splice(i, 1);
                        break;
                      }
                    }
                    setFoods(fList);
                    mountC(false);
                    setTimeout(function () {
                      setSelectedItem(foods[0]);
                      mountC(true);
                    }, 1);
                  },
                },
              ]);
              backCount = 0;
            } else {
              backTimer = setTimeout(() => {
                backCount = 0;
              }, 800);
            }
          }}
        >
          <Image
            style={styles.image}
            source={{ uri: item.imageURL }}
            contentFit="cover"
            transition={1000}
          />
        </TouchableWithoutFeedback>
      </View>
    );
  };

  // Handler for snapping in Carousel
  const snapHandler = (index) => {
    setSelectedItem(foods[index]);
  };

  // Function to render carousel of food items
  const renderCarousel = () => {
    return (
      <View style={styles.carousel}>
        <Carousel
          mode={"parallax"}
          data={foods}
          width={styles.carousel.width}
          scrollAnimationDuration={750}
          onSnapToItem={snapHandler}
          renderItem={foodRender}
          pagingEnabled={true}
          loop={false}
        />
      </View>
    );
  };

  // Function to render ingredients
  const renderIngredients = () => {
    return (
      <View style={{ flex: 1, backgroundColor: themeColor }}>
        <ScrollView
          contentContainerStyle={{
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={[styles.listItem, { padding: 20 }]}>
            {itemSelected.ingredients}
          </Text>
        </ScrollView>
      </View>
    );
  };

  // Function to render allergens
  const renderAllergens = () => {
    return (
      <View style={{ flex: 1, backgroundColor: themeColor }}>
        <ScrollView
          contentContainerStyle={{
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={[styles.listItem, { padding: 20 }]}>
            {itemSelected.allergens}
          </Text>
        </ScrollView>
      </View>
    );
  };

  // Function to render nutrients
  const renderNutrients = () => {
    return (
      <View style={{ flex: 1, backgroundColor: themeColor }}>
        <FlatList
          style={styles.flatListStyle}
          persistentScrollbar={true}
          data={itemSelected.nutrients}
          renderItem={({ item }) => {
            return (
              <Text style={styles.listItem}>
                <Text style={{ fontWeight: "bold" }}>
                  {item.name.truncate(20, true)}
                </Text>
                {": " + item.value}
              </Text>
            );
          }}
        />
      </View>
    );
  };

  // Function to consult Gemini AI
  async function consultBard() {
    if (!(prompt == "")) {
      setResponse("Loading...");
      try {
        initial =
          prompt +
          "\n Use this data '" +
          JSON.stringify({ foodData: foods }) +
          "', use ' ' instead of '_' when possible, use plain english, be concise but descriptive, use complete sentences, proffessional style, neutral tone, do not list data, avoid explicitly using object key names as a unit in the response (use '100g' for amount of nutrient per 100g, use 'serving' for amount of nutrient per serving, use 'energy_kcal' for calories when possible, use 'unit' for the unit of 'serving' or '100g', use 'serving_size' in root of food object to determine the serving size for any calculations)";
        const result = await model.generateContent(initial);
        const response = await result.response;
        setResponse(response.text());
      } catch (err) {
        setResponse(
          "An error has occured. It's possible that the developer has been rate limited. If this is the case, try again later, or contact the developer for support."
        );
      }
    } else {
      alert("Text input empty.");
    }
  }

  return (
    // Main container view
    <View style={[styles.container, { backgroundColor: "white" }]}>
      <Button
        style={{ height: "100%", position: "absolute", left: 4 }}
        icon={"keyboard-backspace"}
        onPress={triggerOut}
      >
        Scan Items
      </Button>
      <Button
        style={{ height: "100%", position: "absolute", right: 4 }}
        contentStyle={{ flexDirection: "row-reverse" }}
        icon={"robot-outline"}
        onPress={toggleModal}
        disabled={foods.length == 0}
      >
        Gemini 1.0
      </Button>

      {foods.length > 0 ? (
        <View style={{ flex: 20, position: "absolute", top: 41 }}>
          <View style={styles.container}>
            {/* Food information */}
            <View
              style={{
                height: Dimensions.get("window").height / 8,
                width: "100%",
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "#f2edf8",
              }}
            >
              <Text style={[styles.header, { color: "rgb(60, 60, 60)" }]}>
                {itemSelected.name
                  .replaceAll(",", "")
                  .replaceAll(/\b\w/g, (match) => match.toUpperCase())
                  .truncate(15, true)}
              </Text>
              <Button
                icon="magnify"
                onPress={() => {
                  Linking.openURL(
                    "https://www.google.com/search?q=" +
                      itemSelected.categories.replaceAll(",", " OR")
                  );
                }}
                labelStyle={[
                  styles.subheader,
                  {
                    color: "#663399",
                    textDecorationLine: "underline",
                    fontSize: 20,
                  },
                ]}
              >
                {itemSelected.categories.truncate(25, true)}
              </Button>
            </View>

            {/* Carousel of food items */}
            <View
              style={[
                styles.carousel,
                { height: (Dimensions.get("window").height / 7) * 2 },
              ]}
            >
              <Text
                style={{
                  position: "absolute",
                  left: 0,
                  bottom: 2,
                  fontWeight: "bold",
                  width: "100%",
                  textAlign: "center",
                }}
              >
                Double tap to remove item
              </Text>
              {cMounted && renderCarousel()}
            </View>

            {/* Additional information */}
            <View
              style={{
                height: Dimensions.get("window").height / 7 + 35,
                width: "100%",
                backgroundColor: "#f2edf8",
                gap: 10,
                padding: 10,
              }}
            >
              <ScrollView>
                <Text
                  style={[
                    styles.subheader,
                    { padding: 5, paddingLeft: 20, paddingRight: 20 },
                  ]}
                >
                  <Text style={{ fontWeight: "bold" }}>Brand: </Text>
                  {itemSelected.brand}
                </Text>
                <Text
                  style={[
                    styles.subheader,
                    { padding: 5, paddingLeft: 20, paddingRight: 20 },
                  ]}
                >
                  <Text style={{ fontWeight: "bold" }}>Serving: </Text>
                  {itemSelected.serving_quantity +
                    itemSelected.serving_quantity_unit}
                </Text>
                <Text
                  style={[
                    styles.subheader,
                    { padding: 5, paddingLeft: 20, paddingRight: 20 },
                  ]}
                >
                  <Text style={{ fontWeight: "bold" }}>Total Quantity: </Text>
                  {itemSelected.total_quantity}
                </Text>
                <Text
                  style={[
                    styles.subheader,
                    { padding: 5, paddingLeft: 20, paddingRight: 20 },
                  ]}
                >
                  <Text style={{ fontWeight: "bold" }}>Nutriscore Grade: </Text>
                  {itemSelected.nutriscore_grade}
                </Text>
              </ScrollView>
            </View>

            {/* Tab navigation for Ingredients, Allergens, and Nutrients */}
            <NavigationContainer
              initialRouteName="Ingredients"
              style={{
                height: (Dimensions.get("window").height / 7) * 2,
                width: "100%",
              }}
            >
              <Tab.Navigator
                screenOptions={{
                  tabBarActiveTintColor: "#663399",
                  tabBarLabelStyle: { fontSize: 12 },
                  tabBarStyle: { backgroundColor: "rgb(250, 246  , 250)" },
                  tabBarIndicatorStyle: {
                    backgroundColor: "#ad90d5", // Change this to your desired color
                    height: 2, // Adjust the height of the underline as needed
                  },
                }}
                style={{
                  height: (Dimensions.get("window").height / 7) * 2,
                  width: "100%",
                }}
              >
                <Tab.Screen
                  name="Ingredients"
                  children={renderIngredients}
                ></Tab.Screen>
                <Tab.Screen
                  name="Allergens"
                  children={renderAllergens}
                ></Tab.Screen>
                <Tab.Screen
                  name="Nutrients"
                  contentContainerStyle={{ backgroundColor: themeColor }}
                  children={renderNutrients}
                ></Tab.Screen>
              </Tab.Navigator>
            </NavigationContainer>
          </View>

          {/* Gemini Modal */}
          <Modal
            isVisible={modalVisibility}
            animationInTiming={600}
            animationOutTiming={600}
            deviceHeight={Dimensions.get("window").height}
            deviceWidth={Dimensions.get("window").width}
          >
            <View style={styles.modal}>
              <Button
                onPress={toggleModal}
                icon={"keyboard-backspace"}
                style={{ position: "absolute", left: 10, top: 15 }}
              >
                <Text>Exit</Text>
              </Button>
              <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
                <View style={{ flex: 2, marginTop: 10 }}>
                  <View
                    style={{
                      flex: 1,
                      alignItems: "center",
                      justifyContent: "center",
                      display: "flex",
                    }}
                  >
                    <Text style={styles.header}>Gemini 1.0</Text>
                  </View>
                  <View
                    style={{
                      gap: 5,
                      height: "10%",
                      flex: 1,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "100%",
                    }}
                  >
                    <TextInput
                      multiline={true}
                      placeholder={"Ask Question..."}
                      style={{ flex: 7 }}
                      onSubmitEditing={Keyboard.dismiss}
                      onChangeText={(text) => {
                        setPrompt(text);
                      }}
                    ></TextInput>
                    <Button
                      icon={"arrow-right-bold-box"}
                      contentStyle={{ flexDirection: "row-reverse" }}
                      onPress={consultBard}
                    >
                      Enter
                    </Button>
                  </View>
                </View>
              </TouchableWithoutFeedback>
              <View
                style={{
                  width: "100%",
                  flex: 3,
                  backgroundColor: "rgb(230, 230, 230)",
                  borderRadius: 10,
                  borderTopLeftRadius: 0,
                  padding: 10,
                  marginTop: 2,
                }}
              >
                <ScrollView>
                  <Markdown style={{ fontSize: 30 }}>{chatResponse}</Markdown>
                </ScrollView>
              </View>
              <Text
                style={{
                  fontSize: 13,
                  paddingTop: 5,
                  color: "rgb(200, 200, 200)",
                  textAlign: "center",
                }}
              >
                *Gemini can sometimes return wrong facts or data
              </Text>
            </View>
          </Modal>
        </View>
      ) : (
        <View
          style={{
            flex: 20,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#663399",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 1,
            shadowRadius: 20,
            elevation: 9,
          }}
        >
          <View
            style={{
              marginBottom: 5,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MaterialCommunityIcons
              name="magnify-scan"
              size={50}
              color="#663399"
            />
            <Text style={[styles.header, { color: "#663399" }]}>
              {" "}
              NutriScan
            </Text>
          </View>
          <Text style={styles.body}>Scan Items to get started.</Text>
        </View>
      )}
    </View>
  );
}

// Styles for the components
const styles = StyleSheet.create({
  info: {
    flex: 1,
  },
  flatListStyle: {
    marginBottom: 10,
  },
  container: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  imageContainer: {
    width: "auto",
    height: "100%",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  modal: {
    backgroundColor: "white",
    borderRadius: 50,
    padding: 30,
    height: Dimensions.get("window").height / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  listItem: {
    fontSize: 18,
    textAlign: "center",
    padding: 5,
  },
  itemContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 5,
  },
  image: {
    flex: 1,
    width: "100%",
    borderRadius: 50,
  },
  toolbar: {
    backgroundColor: "white",
    width: "100%",
    top: 0,
    left: 0,
    flex: 1,
    flexDirection: "row",
  },
  carousel: {
    width: Dimensions.get("window").width,
  },
  header: {
    fontSize: 40,
    textAlign: "center",
    color: "rgb(60, 60, 60)",
  },
  subheader: {
    fontSize: 22,
    textAlign: "center",
    color: "rgb(60, 60, 60)",
  },
  body: {
    fontSize: 15,
    textAlign: "center",
    color: "rgb(60, 60, 60)",
  },
});
