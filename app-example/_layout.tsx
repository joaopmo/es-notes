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
import "react-native-reanimated";
import { useColorScheme } from "@/hooks/useColorScheme";
import NavigationBar from "@/components/NavigationBar";

const { LightTheme, DarkTheme } = adaptNavigationTheme({
  reactNavigationLight: NavigationDefaultTheme,
  reactNavigationDark: NavigationDarkTheme,
});

const CombinedDefaultTheme = mergeThemes(MD3LightTheme, LightTheme);
const CombinedDarkTheme = mergeThemes(MD3DarkTheme, DarkTheme);

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider
      value={colorScheme === "dark" ? CombinedDarkTheme : CombinedDefaultTheme}
    >
      <PaperProvider>
        <Stack
          screenOptions={{
            header: (props) => <NavigationBar {...props} />,
          }}
          initialRouteName="editor"
        >
          <Stack.Screen name="editor" />
          <Stack.Screen name="folder" />
          <Stack.Screen name="+not-found" />
        </Stack>
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
