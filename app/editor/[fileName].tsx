import { useCallback, useEffect, useState } from "react";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { KeyboardAvoidingView, Platform, View } from "react-native";
import { MarkdownTextInput } from "@expensify/react-native-live-markdown";
import { useFileSystemMethods } from "@/components/providers/FileSystem";
import { ActivityIndicator, useTheme } from "react-native-paper";
import EditorHeaderRight from "@/components/headers/EditorHeaderRight";

export default function Editor() {
  const theme = useTheme();
  const navigation = useNavigation();
  const [hasChanged, setHasChanged] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [text, setText] = useState("");
  const { fileName } = useLocalSearchParams();
  const { readContentAsync, writeContent } = useFileSystemMethods();

  const saveContent = useCallback(() => {
    setHasChanged(false);
    writeContent(fileName as string, text);
  }, [fileName, text, writeContent]);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: decodeURI(fileName as string),
      headerRight: () => (
        <EditorHeaderRight
          hasChanged={hasChanged}
          onPress={() => saveContent()}
        />
      ),
    });
  }, [fileName, hasChanged, navigation, saveContent]);

  useEffect(() => {
    readContentAsync(fileName as string)
      .then((content) => {
        setText(content);
        setInitialized(true);
      })
      .catch(console.error);
  }, [fileName, readContentAsync]);

  return (
    <View style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{
          flex: 1,
          padding: 16,
        }}
      >
        {!initialized && <ActivityIndicator />}
        {initialized && (
          <MarkdownTextInput
            value={text}
            onChangeText={(text) => {
              setText(text);
              setHasChanged(true);
            }}
            multiline
            style={{
              color: theme.colors.onSurface,
              flex: 1,
              textAlignVertical: "top",
              width: "100%",
              overflow: "scroll",
            }}
          />
        )}
      </KeyboardAvoidingView>
    </View>
  );
}
