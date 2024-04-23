import React, { useState, useEffect, useRef } from "react";
import {
  Text,
  View,
  StyleSheet,
  Button,
  Platform,
  TouchableOpacity,
  Alert,
} from "react-native";
import { PaperProvider, Portal, Snackbar } from "react-native-paper";
import { CameraView, useCameraPermissions } from "expo-camera/next";
import { VideoStabilization } from "expo-camera";
function isValidBarcode(value) {
  // We only allow correct length barcodes
  if (!value.match(/^(\d{8}|\d{12,14})$/)) {
    return false;
  }

  const paddedValue = value.padStart(14, "0");

  let result = 0;
  for (let i = 0; i < paddedValue.length - 1; i += 1) {
    result += parseInt(paddedValue.charAt(i), 10) * (i % 2 === 0 ? 3 : 1);
  }

  return (10 - (result % 10)) % 10 === parseInt(paddedValue.charAt(13), 10);
}
export default function FoodScanner({ size, onScanned, onScanHandlerTrue }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [snackVis, setSnackVis] = useState(false);
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
  async function handler({ type, data }) {
    if (type.startsWith("org.gs1.")) {
      setScanned(true);
      setSnackVis(true);
      val = await onScanned(type, data);
      if (!val) {
        setSnackVis(false);
        Alert.alert("Your item could not be found in the database.", "", [
          {
            text: "OK",
            onPress: () => {
              setScanned(false);
              scannedBool = false;
            },
          },
        ]);
      } else {
        mounted.current = false;
        setSnackVis(false);
        await onScanHandlerTrue();
      }
    }
  }

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
      <Snackbar
        visible={snackVis}
        onDismiss={() => {
          setSnackVis(false);
        }}
      >
        Querying databases...
      </Snackbar>
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
