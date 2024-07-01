import React from "react";
import { StyleSheet, View } from "react-native";
import {
  Card,
  Text,
  Icon,
  useTheme,
  TouchableRipple,
  Badge,
} from "react-native-paper";
import {
  useFileSystemMethods,
  useFileSystemState,
} from "./providers/FileSystem";

interface FolderCardProps {
  title: string;
  selected: boolean;
  onLongPress: (fileName: string) => void;
  disablePress: boolean;
}

export default function FolderCard({
  title,
  selected,
  onLongPress,
  disablePress,
}: FolderCardProps) {
  const theme = useTheme();
  const { directoryInfo } = useFileSystemState();
  const { setDirectory } = useFileSystemMethods();

  return (
    <TouchableRipple
      onPress={() => {
        if (disablePress) return onLongPress(title);
        setDirectory(directoryInfo.uri + title);
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
          <Icon source="folder" size={20} />
          <Text variant="titleMedium" style={{ color: theme.colors.primary }}>
            {decodeURI(title)}
          </Text>
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
    height: 60,
  },
  badge: {
    position: "absolute",
    top: 5,
    right: 5,
  },
  container: {
    gap: 8,
    flex: 1,
    margin: 16,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
  },
});
