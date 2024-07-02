import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { Text, Button } from "react-native";
import { FileSystemProvider, FileSystemContext } from "../FileSystem";

const EncodingType = {
  UTF8: "utf8",
  Base64: "base64",
};

const initDir = "md/";

const documentDirectory = "file://documentDirectory/";

jest.mock("expo-file-system", () => ({
  EncodingType,
  documentDirectory,
  getInfoAsync: jest.fn((fileUri) => {
    const current = fileUri.split("/").slice(-2).join("/");

    return Promise.resolve({
      exists: true,
      uri: fileUri,
      size: 1,
      isDirectory: current.includes("dir"),
      modificationTime: 1,
    });
  }),
  readDirectoryAsync: jest.fn(() => Promise.resolve(["dir1", "dir2"])),
  deleteAsync: jest.fn(() => Promise.resolve()),
  makeDirectoryAsync: jest.fn(() => Promise.resolve()),
  readAsStringAsync: jest.fn(() => Promise.resolve("file content")),
  writeAsStringAsync: jest.fn(() => Promise.resolve()),
}));

test("FileSystemProvider inicializa a classe FS com o diretório md", async () => {
  const screen = render(
    <FileSystemProvider>
      <FileSystemContext.Consumer>
        {(value) => <Text>Received: {value.state.directoryInfo.uri}</Text>}
      </FileSystemContext.Consumer>
    </FileSystemProvider>
  );

  const text = (await screen.findByText(/^Received:/)).children;

  expect(text).toEqual(["Received: ", documentDirectory + initDir]);
});

test("FileSystemProvider possui sub-diretórios", async () => {
  const screen = render(
    <FileSystemProvider>
      <FileSystemContext.Consumer>
        {(value) => (
          <Text>
            Received: {value.state.directoryContent.directories.length}
          </Text>
        )}
      </FileSystemContext.Consumer>
    </FileSystemProvider>
  );

  const text = (await screen.findByText(/^Received:/)).children;

  expect(text).toEqual(["Received: ", "2"]);
});

test("FileSystemProvider não possui arquivos", async () => {
  const screen = render(
    <FileSystemProvider>
      <FileSystemContext.Consumer>
        {(value) => (
          <Text>Received: {value.state.directoryContent.files.length}</Text>
        )}
      </FileSystemContext.Consumer>
    </FileSystemProvider>
  );

  const text = (await screen.findByText(/^Received:/)).children;

  expect(text).toEqual(["Received: ", "0"]);
});

test("FileSystemProvider cria um arquivo e atualiza o estado", async () => {
  const screen = render(
    <FileSystemProvider>
      <FileSystemContext.Consumer>
        {(value) => (
          <Button
            title={`Received: ${value.state.directoryContent.files.length}`}
            onPress={() => {
              value.methods.writeContent("file1/", "content");
            }}
          />
        )}
      </FileSystemContext.Consumer>
    </FileSystemProvider>
  );

  let text = await screen.findByText(/^Received:/);

  expect(text.children).toEqual(["Received: 0"]);

  fireEvent.press(text);

  text = await screen.findByText(/^Received:/);

  expect(text.children).toEqual(["Received: 1"]);
});

test("FileSystemProvider deleta um diretório e atualiza o estado", async () => {
  const screen = render(
    <FileSystemProvider>
      <FileSystemContext.Consumer>
        {(value) => (
          <Button
            title={`Received: ${value.state.directoryContent.directories.length}`}
            onPress={() => {
              value.methods.remove("dir1/");
            }}
          />
        )}
      </FileSystemContext.Consumer>
    </FileSystemProvider>
  );

  let text = await screen.findByText(/^Received:/);

  expect(text.children).toEqual(["Received: 2"]);

  fireEvent.press(text);

  text = await screen.findByText(/^Received:/);

  expect(text.children).toEqual(["Received: 1"]);
});
