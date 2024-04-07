import React, { useState, useEffect, useRef } from "react";
import {
  Text,
  View,
  StyleSheet,
  Button,
  Platform,
  TouchableOpacity,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera/next";
import { VideoStabilization } from "expo-camera";

export default function FoodScanner({ size, onScanned }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
    };
  }, []);

  if (!permission) {
    requestPermission();
    return <Text>Requesting for camera permission</Text>;
  }

  if (!permission.granted) {
    requestPermission();
    return <Text>No access to camera</Text>;
  }
  let scannedBool = false;
  const handler = async ({ type, data }) => {
    console.log(type);
    if (type.startsWith("org.gs1.") && !scannedBool) {
      //
      setScanned(true);
      onScanned(type, data);
    }
  };

  return (
    <View style={styles.container}>
      {mounted && (
        <CameraView
          onBarcodeScanned={scanned ? undefined : handler}
          style={{ width: size[0], height: size[1] }}
          zoom={0}
        />
      )}
      {scanned && (
        <TouchableOpacity
          style={[styles.btn, { width: size[0], height: size[1] + 50 }]}
          onPress={() => {
            setScanned(false);
            scannedBool = false;
          }}
        >
          <Text style={[{ color: "white", fontSize: size[0] / 10 }]}>
            Tap to Scan Again
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    position: "absolute",
    left: 0,
    top: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    color: "white",
  },
  container: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
});
