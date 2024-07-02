import * as EFS from "expo-file-system";
import FS from "./file-system";

const EncodingType = {
  UTF8: "utf8",
  Base64: "base64",
};

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

describe("Testes da classe FS", () => {
  let classInstance: FS;
  const initDir = "md-dir/";

  beforeEach(() => {
    classInstance = new FS({ driver: EFS });
  });

  test("O método init retorna informações do diretório inicializado", async () => {
    const initReturn = await classInstance.init(initDir);

    expect(initReturn.directoryInfo).toEqual(expect.any(Object));
    expect(initReturn.directoryContent).toEqual(
      expect.objectContaining({
        files: expect.any(Array),
        directories: expect.any(Array),
      })
    );
  });

  test("O getter baseDirectoryInfo deve retornar as informações do diretório base", () => {
    expect(classInstance.baseDirectoryInfo).toEqual({
      name: "",
      exists: false,
      isDirectory: false,
      uri: documentDirectory,
    });
  });

  test("O getter baseDirectoryInfo deve retornar as informações do diretório base atualizadas após inicialização", async () => {
    await classInstance.init(initDir);

    expect(classInstance.baseDirectoryInfo).toEqual({
      name: "md-dir",
      exists: true,
      isDirectory: true,
      uri: documentDirectory + initDir,
      size: 1,
      modificationTime: 1,
    });
  });

  test("O getter baseDirectoryContent deve retornar o conteúdo do diretório base", () => {
    expect(classInstance.baseDirectoryContent).toEqual({
      files: [],
      directories: [],
    });
  });

  test("O método setDirectory retorna o diretório base quando a classe não é inicializada", async () => {
    const setDirectoryReturn = await classInstance.setDirectory(
      documentDirectory + initDir
    );

    expect(setDirectoryReturn.directoryInfo.exists).toBeFalsy();
    expect(setDirectoryReturn.directoryInfo.isDirectory).toBeFalsy();
  });

  test("O método setDirectory retorna o diretório inicializado", async () => {
    await classInstance.init(initDir);
    const setDirectoryReturn = await classInstance.setDirectory(
      documentDirectory + initDir
    );

    expect(setDirectoryReturn.directoryInfo.exists).toBeTruthy();
    expect(setDirectoryReturn.directoryInfo.isDirectory).toBeTruthy();
  });

  test("O método makeDirectoryAsync cria um novo diretório e retorna o diretório inicializado com a atualização", async () => {
    const initReturn = await classInstance.init(initDir);

    expect(initReturn.directoryContent.directories).toHaveLength(2);

    const makeDirectoryReturn = await classInstance.makeDirectoryAsync("new/");

    expect(makeDirectoryReturn.directoryContent.directories).toHaveLength(3);
  });

  test("O método makeDirectoryAsync cria multiplos diretórios e retorna o diretório inicializado com a atualização", async () => {
    const initReturn = await classInstance.init(initDir);

    expect(initReturn.directoryContent.directories).toHaveLength(2);

    const makeDirectoryReturn = await classInstance.makeDirectoryAsync([
      "new1/",
      "new2/",
    ]);

    expect(makeDirectoryReturn.directoryContent.directories).toHaveLength(4);
  });

  test("O método writeContentAsync cria um novo arquivo e retorna o diretório inicializado com a atualização", async () => {
    const initReturn = await classInstance.init(initDir);

    expect(initReturn.directoryContent.files).toHaveLength(0);

    const writeContentReturn = await classInstance.writeContentAsync(
      "file1",
      "content"
    );

    expect(writeContentReturn.directoryContent.files).toHaveLength(1);
  });

  test("O método writeContentAsync atualiza o conteúdo de um arquivo e retorna o diretório inicializado com a atualização", async () => {
    await classInstance.init(initDir);

    const writeContentReturn = await classInstance.writeContentAsync(
      "file1/",
      "content"
    );

    expect(writeContentReturn.directoryContent.files).toHaveLength(1);

    const writeContentReturn2 = await classInstance.writeContentAsync(
      "file1/",
      "new content"
    );

    expect(writeContentReturn2.directoryContent.files).toHaveLength(1);
    expect(writeContentReturn.directoryContent.files[0].preview).toBe(
      "new content"
    );
  });

  test("O método removeAsync remove um arquivo e retorna o diretório inicializado com a atualização", async () => {
    await classInstance.init(initDir);

    const writeContentReturn = await classInstance.writeContentAsync(
      "file1",
      "content"
    );

    expect(writeContentReturn.directoryContent.files).toHaveLength(1);

    const removeAsyncReturn = await classInstance.removeAsync("file1/");

    expect(removeAsyncReturn.directoryContent.files).toHaveLength(0);
  });

  test("O método removeAsync remove multiplos arquivos e retorna o diretório inicializado com a atualização", async () => {
    await classInstance.init(initDir);

    await classInstance.writeContentAsync("file1/", "content");

    const writeContentReturn = await classInstance.writeContentAsync(
      "file2/",
      "content"
    );

    expect(writeContentReturn.directoryContent.files).toHaveLength(2);

    const removeAsyncReturn = await classInstance.removeAsync([
      "file1/",
      "file2/",
    ]);

    expect(removeAsyncReturn.directoryContent.files).toHaveLength(0);
  });

  test("O método removeAsync remove um diretório e retorna o diretório inicializado com a atualização", async () => {
    const initReturn = await classInstance.init(initDir);

    expect(initReturn.directoryContent.directories).toHaveLength(2);

    const removeAsyncReturn = await classInstance.removeAsync("dir1/");

    expect(removeAsyncReturn.directoryContent.directories).toHaveLength(1);
  });

  test("O método removeAsync remove multiplos diretórios e retorna o diretório inicializado com a atualização", async () => {
    const initReturn = await classInstance.init(initDir);

    expect(initReturn.directoryContent.directories).toHaveLength(2);

    const removeAsyncReturn = await classInstance.removeAsync([
      "dir1/",
      "dir2/",
    ]);

    expect(removeAsyncReturn.directoryContent.directories).toHaveLength(0);
  });

  test("O método removeAsync remove um arquivo e um diretório e retorna o diretório inicializado com a atualização", async () => {
    const initReturn = await classInstance.init(initDir);

    expect(initReturn.directoryContent.directories).toHaveLength(2);

    const writeContentReturn = await classInstance.writeContentAsync(
      "file1/",
      "content"
    );

    expect(writeContentReturn.directoryContent.files).toHaveLength(1);

    const removeAsyncReturn = await classInstance.removeAsync([
      "file1/",
      "dir1/",
    ]);

    expect(removeAsyncReturn.directoryContent.files).toHaveLength(0);
    expect(removeAsyncReturn.directoryContent.directories).toHaveLength(1);
  });

  test("O método readContentAsync lê o conteúdo de um arquivo e retorna o conteúdo", async () => {
    const readContentAsyncReturn =
      await classInstance.readContentAsync("file1");

    expect(readContentAsyncReturn).toBe("file content");
  });
});
