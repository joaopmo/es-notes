import React from "react";
import { IconButton, Menu, TextInput } from "react-native-paper";
import { useDialog } from "@/components/providers/Dialog";
import { useFileSystemMethods } from "../providers/FileSystem";

export function IndexHeaderRight() {
  const showDialog = useDialog();
  const [visible, setVisible] = React.useState(false);
  const { makeDirectory, writeContent } = useFileSystemMethods();

  const openMenu = () => setVisible(true);

  const closeMenu = () => setVisible(false);

  const newFile = async () => {
    closeMenu();

    let fileName = await showDialog({
      title: "Novo Arquivo",
      textInputProps: {
        label: "Nome",
        left: <TextInput.Icon icon="file-outline" />,
      },
    });

    if (fileName) {
      fileName += fileName.endsWith(".md") ? "" : ".md";
      writeContent(encodeURI(fileName), "");
    }
  };

  const newDirectory = async () => {
    closeMenu();

    const fileName = await showDialog({
      title: "Novo Diretório",
      textInputProps: {
        label: "Nome",
        left: <TextInput.Icon icon="folder-outline" />,
      },
    });

    if (fileName) {
      makeDirectory(encodeURI(fileName));
    }
  };

  return (
    <Menu
      visible={visible}
      onDismiss={closeMenu}
      anchor={<IconButton icon="dots-vertical" size={20} onPress={openMenu} />}
    >
      <Menu.Item
        leadingIcon="file-plus-outline"
        onPress={() => newFile()}
        title="Novo Arquivo"
      />
      <Menu.Item
        leadingIcon="folder-plus-outline"
        onPress={() => newDirectory()}
        title="Novo Diretório"
      />
    </Menu>
  );
}
