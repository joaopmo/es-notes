import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import {
  useFileSystemMethods,
  useFileSystemState,
} from "@/components/providers/FileSystem";
import FileCard from "@/components/FileCard";
import FolderCard from "@/components/FolderCard";
import { useNavigation } from "expo-router";
import { IndexHeaderRight } from "@/components/headers/IndexHeaderRight";
import { ActivityIndicator, IconButton, useTheme } from "react-native-paper";

export default function Index() {
  const theme = useTheme();
  const navigation = useNavigation();
  const [selected, setSelected] = useState<string[]>([]);
  const { initialized, loading, directoryInfo, directoryContent } =
    useFileSystemState();
  const { remove, setDirectory } = useFileSystemMethods();

  useEffect(() => {
    navigation.setOptions({
      headerTitle: "Notes",
      headerLeft: () => {
        if (directoryInfo.uri.endsWith("md/")) {
          return;
        }

        return (
          <IconButton
            icon="step-backward"
            size={20}
            onPress={() => {
              const previousUri = directoryInfo.uri
                .split("/")
                .slice(0, -2)
                .join("/");

              setDirectory(previousUri);
            }}
          />
        );
      },
      headerRight: () => {
        if (selected.length === 0) {
          return <IndexHeaderRight />;
        }

        return (
          <IconButton
            icon="trash-can-outline"
            size={20}
            iconColor={theme.colors.error}
            onPress={() => {
              remove(selected);
              setSelected([]);
            }}
          />
        );
      },
    });
  }, [
    directoryInfo.uri,
    navigation,
    remove,
    selected,
    selected.length,
    setDirectory,
    theme.colors.error,
  ]);

  const onItemLongPress = (fileName: string) => {
    setSelected((prevValue) => {
      const prevSelected = [...prevValue];
      const index = prevSelected.indexOf(fileName);

      if (index === -1) {
        prevSelected.push(fileName);
      } else {
        prevSelected.splice(index, 1);
      }

      return prevSelected;
    });
  };

  return (
    <ScrollView style={styles.scrollViewContainer}>
      {!initialized || loading ? (
        <ActivityIndicator />
      ) : (
        <View>
          <View style={styles.listContainer}>
            {directoryContent.directories.map((directory) => (
              <FolderCard
                title={directory.name}
                key={directory.uri}
                onLongPress={onItemLongPress}
                selected={selected.includes(directory.name)}
                disablePress={selected.length > 0}
              />
            ))}
          </View>
          <View style={styles.listContainer}>
            {directoryContent.files.map((file) => (
              <FileCard
                title={file.name}
                content={file.preview}
                key={file.uri}
                onLongPress={onItemLongPress}
                selected={selected.includes(file.name)}
                disablePress={selected.length > 0}
              />
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollViewContainer: {
    flex: 1,
  },
  listContainer: {
    display: "flex",
    flexWrap: "wrap",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
