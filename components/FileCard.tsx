import React from "react";
import {
  Badge,
  Card,
  Text,
  TouchableRipple,
  useTheme,
} from "react-native-paper";
import { MarkdownTextInput } from "@expensify/react-native-live-markdown";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";

interface FileCardProps {
  title: string;
  content: string;
  selected: boolean;
  onLongPress: (fileName: string) => void;
  disablePress: boolean;
}

export default function FileCard({
  title,
  content,
  selected,
  onLongPress,
  disablePress,
}: FileCardProps) {
  const theme = useTheme();

  return (
    <TouchableRipple
      onPress={() => {
        if (disablePress) return onLongPress(title);
        router.push(`/editor/${title}`);
      }}
      onLongPress={() => onLongPress(title)}
      style={styles.touchableRipple}
    >
      <Card
        style={styles.card}
        contentStyle={{ flex: 1, display: "flex" }}
        mode={selected ? "outlined" : "elevated"}
      >
        {selected && <Badge style={styles.badge} size={15} />}
        <View style={styles.container}>
          <View style={styles.markdownContainer}>
            <MarkdownTextInput
              value={content}
              multiline
              readOnly
              scrollEnabled={false}
              editable={false}
              style={{ color: theme.colors.onSurface }}
            />
          </View>
          <LinearGradient
            colors={[
              theme.colors.elevation.level0,
              theme.colors.elevation.level1,
            ]}
            locations={[0.1, 0.5]}
            style={{ paddingBottom: 1 }}
          >
            <Text
              variant="titleMedium"
              style={{ color: theme.colors.primary, textAlign: "center" }}
            >
              {decodeURI(title)}
            </Text>
          </LinearGradient>
        </View>
      </Card>
    </TouchableRipple>
  );
}

const styles = StyleSheet.create({
  touchableRipple: {
    width: "45%",
    margin: 8,
  },
  card: {
    position: "relative",
    overflow: "hidden",
    width: "100%",
    height: 250,
  },
  badge: {
    position: "absolute",
    top: 5,
    right: 5,
  },
  container: {
    flex: 1,
    display: "flex",
    position: "relative",
    flexDirection: "column",
    justifyContent: "flex-end",
    marginTop: 16,
    marginLeft: 16,
    marginRight: 16,
  },
  markdownContainer: { position: "absolute", top: 0 },
});
