// Importing necessary modules from React Native
import React, { useState } from "react";
import {
  Text,
  View,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Platform,
} from "react-native";
import FoodView from "./components/FoodView";
import { Button } from "react-native-paper";
import FoodScanner from "./components/FoodScanner";
import { TabView, SceneMap } from "react-native-tab-view";
import {
  useSafeAreaInsets,
  SafeAreaProvider,
} from "react-native-safe-area-context";

// Function to generate a random ID of specified length
function makeid(length) {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

// Function to check if a value is null or undefined
function nullCheck(value) {
  if (
    value === undefined ||
    value === null ||
    value === "undefined" ||
    value === "null" ||
    value === ""
  ) {
    return true;
  } else {
    return false;
  }
}

// Function to remove undefined properties from an object
function removeUndefined(obj) {
  for (var k in obj) {
    if (typeof obj[k] == "object" && obj[k] !== null) removeUndefined(obj[k]);
    else if (nullCheck(obj[k])) {
      obj[k] = "(not found)";
    }
  }
}

// App component definition
export default function App() {
  // State variables
  const [foodsList, setFoodsList] = useState([]);
  const [index, setIndex] = useState(1);

  // Handler function for scanning food items
  const scanHandler = async (type, data) => {
    try {
      const response = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${data.substring(
          1
        )}.json`
      );

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const json = await response.json();
      const myItem = {
        imageURL: json.product.image_url,
        allergens: (json.product.allergens.length === 0
          ? json.product.allergens_from_ingredients
          : json.product.allergens
        ).replaceAll("en:", ""),
        keywords: json.product._keywords,
        brand: json.product.brands,
        name: json.product.product_name.replaceAll("/", ""),
        categories: json.product.categories,
        code: json.product.code,
        ingredients: json.product.ingredients_text,
        nutrients: {},
        serving_quantity: json.product.serving_quantity,
        serving_quantity_unit: json.product.serving_quantity_unit,
        serving_size: json.product.serving_size,
        total_quantity: json.product.quantity,
        nutriscore_grade: json.product.nutriscore_grade,
        key: makeid(20),
      };
      // Extracting and formatting nutrient information
      for (const [key, value] of Object.entries(json.product.nutriments)) {
        if (!(key.split("_")[0].replaceAll("-", "_") in myItem.nutrients)) {
          myItem.nutrients[key.split("_")[0].replaceAll("-", "_")] = {};
        }
        myItem.nutrients[key.split("_")[0].replaceAll("-", "_")][
          key.includes("_") ? key.split(/_(.*)/s)[1] : "amount"
        ] = value;
      }

      // Remove undefined properties from the item
      removeUndefined(myItem);

      // Update foodsList state
      setFoodsList((prevFoodsList) => [...prevFoodsList, myItem]);
      return true;
    } catch (error) {
      // Handle error if necessary
      console.error(error);
      return false;
    }
  };

  // Scene for rendering Home tab
  const HomeScene = ({ jump }) => (
    <View style={{ flex: 1 }}>
      <View
        style={{
          marginTop:
            Platform.OS === "ios"
              ? useSafeAreaInsets().top
              : StatusBar.currentHeight,
          flex: 1,
        }}
      >
        <FoodView
          style={{ flex: 1, display: "flex" }}
          foods={foodsList}
          setFoods={setFoodsList}
          triggerOut={() => {
            jump("scan");
          }}
        />
      </View>
    </View>
  );

  // Scene for rendering Scan tab
  const ScanScene = ({ jump }) => (
    <View
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View style={styles.camera}>
        <FoodScanner
          size={[styles.camera.width, styles.camera.height]}
          onScanned={scanHandler}
          onScanHandlerTrue={() => {
            jump("home");
          }}
        />
      </View>
      <Button
        style={[
          styles.return,
          {
            top:
              Platform.OS === "ios"
                ? useSafeAreaInsets().top
                : StatusBar.currentHeight,
          },
        ]}
        onPress={() => {
          jump("home");
        }}
        icon="arrow-u-right-bottom"
      >
        Return
      </Button>
    </View>
  );

  // Routes configuration
  const routes = [
    { key: "scan", title: "Scan" },
    { key: "home", title: "Home" },
  ];

  // Render scene based on route
  const renderScene = ({ route, jumpTo }) => {
    switch (route.key) {
      case "home":
        return <HomeScene jump={jumpTo} />;
      case "scan":
        return <ScanScene jump={jumpTo} />;
      default:
        return null;
    }
  };

  return (
    // Main container view
    <SafeAreaProvider>
      <TabView
        renderTabBar={() => null}
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={[
          styles.container,
          { width: Dimensions.get("window").width },
        ]}
        renderLazyPlaceholder={() => (
          <SafeAreaView
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
          >
            <Text>Loading...</Text>
          </SafeAreaView>
        )}
        lazy={({ route }) => {
          return route.key === "scan";
        }}
      />
    </SafeAreaProvider>
  );
}

// Styles for the components
const styles = StyleSheet.create({
  // Styles for the camera view
  toolbar: {
    position: "absolute",
    top: 70,
    left: 0,
    width: Dimensions.get("window").width,
    height: 50,
    justifyContent: "center",
    alignItems: "flex-end",
    backgroundColor: "rgba(255, 255, 255, 0.7)",
  },
  scanned: {
    fontSize: 21,
    color: "#663399",
    marginRight: 20,
  },
  return: {
    position: "absolute",
    left: 15,
    height: 50,
    borderTopRightRadius: 35,
    borderBottomRightRadius: 35,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.4)",
  },
  camera: {
    position: "absolute",
    left: 0,
    top: 0,
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
  },
  // Styles for the main container view
  container: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
  },
});
