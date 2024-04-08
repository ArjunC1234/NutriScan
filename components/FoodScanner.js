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

export default function FoodScanner({ size, onScanned, onScanHandlerTrue }) {
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
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text>Requesting for camera permission.</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text>No access to camera.</Text>
      </View>
    );
  }
  let scannedBool = false;
  const handler = async ({ type, data }) => {
    if (type.startsWith("org.gs1.") && !scannedBool) {
      setScanned(true);
      if (!onScanned(type, data)) {
        alert("Your item could not be found in the database.");
        setScanned(false);
      } else {
        alert("Added item.");
        onScanHandlerTrue();
      }
    }
  };

  return (
    <View style={styles.container}>
      {mounted && (
        <View>
          <CameraView
            onBarcodeScanned={scanned ? undefined : handler}
            style={{ width: size[0], height: size[1] }}
            zoom={0}
          />
          <View style={styles.overlay} />
        </View>
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
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
  },
});
