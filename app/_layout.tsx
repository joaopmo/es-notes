import React from "react";

import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
  Theme,
  ThemeProvider,
} from "@react-navigation/native";
import {
  PaperProvider,
  MD3DarkTheme,
  MD3LightTheme,
  adaptNavigationTheme,
  MD3Theme,
} from "react-native-paper";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { useColorScheme } from "@/hooks/useColorScheme";
import { FileSystemProvider } from "@/components/providers/FileSystem";
import { DialogProvider } from "@/components/providers/Dialog";
import { PaperLightColors, PaperDarkColors } from "@/styles/colors";

const { LightTheme, DarkTheme } = adaptNavigationTheme({
  reactNavigationLight: NavigationDefaultTheme,
  reactNavigationDark: NavigationDarkTheme,
  materialLight: { ...MD3LightTheme, colors: PaperLightColors },
  materialDark: { ...MD3DarkTheme, colors: PaperDarkColors },
});

const CombinedDefaultTheme = mergeThemes(
  { ...MD3LightTheme, colors: PaperLightColors },
  LightTheme
);
const CombinedDarkTheme = mergeThemes(
  { ...MD3DarkTheme, colors: PaperDarkColors },
  DarkTheme
);

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  let theme = colorScheme === "dark" ? CombinedDarkTheme : CombinedDefaultTheme;

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={theme}>
      <PaperProvider theme={theme}>
        <FileSystemProvider>
          <DialogProvider>
            <Stack initialRouteName="index">
              <Stack.Screen name="index" />
              <Stack.Screen name="editor/[fileName]" />
              <Stack.Screen name="+not-found" />
            </Stack>
          </DialogProvider>
        </FileSystemProvider>
      </PaperProvider>
    </ThemeProvider>
  );
}

function mergeThemes(md3Theme: MD3Theme, rnTheme: Theme) {
  return {
    ...md3Theme,
    ...rnTheme,
    colors: {
      ...md3Theme.colors,
      ...rnTheme.colors,
    },
  };
}
