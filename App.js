// Importing necessary modules from React Native
import React, { useState } from "react";
import { Text, View, StyleSheet, Dimensions, SafeAreaView } from "react-native";
import FoodView from "./components/FoodView";
import { Button } from "react-native-paper";
import FoodScanner from "./components/FoodScanner";

// Function to generate a random ID of specified length
function makeid(length) {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
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
  const [showFoodsList, toggleFoodsList] = useState(true);

  // Handler function for scanning food items
  const scanHandler = async (type, data) => {
    try {
      const response = await fetch(
        "https://world.openfoodfacts.org/api/v0/product/" +
          data.substring(1) +
          ".json"
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
    } catch (error) {
      // Handle error if necessary
      alert("Your item could not be found in the database.");
    }
  };

  return (
    // Main container view
    <View style={styles.container}>
      {/* Camera view */}
      {showFoodsList ? (
        <SafeAreaView style={{ flex: 1 }}>
          <FoodView
            style={{ flex: 1, display: "flex" }}
            foods={foodsList}
            setFoods={setFoodsList}
            triggerOut={() => {
              toggleFoodsList(false);
            }}
          />
        </SafeAreaView>
      ) : (
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
            />
          </View>
          <View style={styles.toolbar}>
            <Button
              style={styles.return}
              onPress={() => {
                toggleFoodsList(true);
              }}
              icon="keyboard-backspace"
            >
              Return to Comparison
            </Button>
            <Text style={styles.scanned}>{foodsList.length} item(s)</Text>
          </View>
        </View>
      )}
    </View>
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
    left: 5,
    top: 0,
    height: 50,
    borderTopRightRadius: 35,
    borderBottomRightRadius: 35,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
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
