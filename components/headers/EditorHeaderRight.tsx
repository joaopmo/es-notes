import React from "react";
import { IconButton } from "react-native-paper";

interface EditorHeaderRightProps {
  hasChanged: boolean;
  onPress: () => void;
}

export default function EditorHeaderRight({
  hasChanged,
  onPress,
}: EditorHeaderRightProps) {
  return (
    hasChanged && <IconButton icon="content-save" size={20} onPress={onPress} />
  );
}
