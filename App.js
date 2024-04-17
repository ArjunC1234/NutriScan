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
import Client from "fooddata-central";
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
var returnTypes = (barcode, type) => {
  typeObj = {};
  if (type.startsWith("EAN")) {
    typeObj.EAN = barcode;
    typeObj.GTIN = "0" + barcode;
    if (barcode.startsWith("0")) {
      typeObj.UPC = barcode.substring(1);
    }
  } else if (type.startsWith("GTIN")) {
    typeObj.GTIN = barcode;
    typeObj.EAN = barcode.substring(1);
    if (barcode.startsWith("00")) {
      typeObj.UPC = barcode.substring(2);
    }
  } else if (type.startsWith("UPC")) {
    typeObj.UPC = barcode;
    typeObj.EAN = "0" + barcode;
    typeObj.GTIN = "00" + barcode;
  }
  return typeObj;
};
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
  const client = new Client({
    api_key: process.env.EXPO_PUBLIC_FOODDATA_API_KEY,
  });
  // Handler function for scanning food items
  const scanHandler = async (type, data) => {
    try {
      let code = data;
      // search foods based on an input
      let codes = returnTypes(data, type.split(".")[2]);
      for (const [key, value] of Object.entries(codes)) {
        const results = await client.search({
          generalSearchInput: value,
        });

        if (results.success) {
          if (results.data.foods.length == 0) {
            continue;
          }
          const details = await client.details(results.data.foods[0].fdcId);
          if (details === undefined) {
            continue;
          }
          if (details.success) {
            const response = await fetch(
              `https://world.openfoodfacts.org/api/v0/product/${data}.json`
            );

            if (!response.ok) {
              continue;
            }

            const json = await response.json();
            if (!("product" in json)) {
              json = { product: {} };
              json.product.image_url =
                "https://st4.depositphotos.com/17828278/24401/v/450/depositphotos_244011872-stock-illustration-image-vector-symbol-missing-available.jpg";
              json.product.allergens = "No allergen information was found.";
              json.product.code = data;
              json.product.quantity = "(not found)";
              json.product.nutriscore_grade = "(not found)";
              json.product._keywords = "(not found)";
            }
            const myItem = {
              imageURL:
                json.product.image_url ||
                "https://st4.depositphotos.com/17828278/24401/v/450/depositphotos_244011872-stock-illustration-image-vector-symbol-missing-available.jpg",
              allergens:
                (json.product.allergens.length === 0
                  ? json.product.allergens_from_ingredients
                  : json.product.allergens
                ).replaceAll("en:", "") ||
                "Either no allergens are present or none were found.",
              keywords: json.product._keywords,
              brand: details.data.brandName,
              name: details.data.description,
              categories: details.data.brandedFoodCategory,
              code: json.product.code,
              ingredients: details.data.ingredients,
              nutrients: [],
              serving_quantity: details.data.servingSize,
              serving_quantity_unit: details.data.servingSizeUnit,
              total_quantity: json.product.quantity || "(not found)",
              nutriscore_grade:
                json.product.nutriscore_grade.toUpperCase() || "(not found)",
              key: makeid(20),
            };
            for (var x = 0; x < details.data.foodNutrients.length; x++) {
              i = details.data.foodNutrients[x];
              myItem.nutrients.push({
                name: i.nutrient.name,
                value:
                  Math.round(i.amount * (myItem.serving_quantity / 100)) +
                  i.nutrient.unitName,
              });
            }

            // Remove undefined properties from the item
            removeUndefined(myItem);

            // Update foodsList state
            setFoodsList((prevFoodsList) => [...prevFoodsList, myItem]);
            return true;
          } else {
            continue;
          }
        } else {
          continue;
        }
      }
      return false;
      // Extracting and formatting nutrient information
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
