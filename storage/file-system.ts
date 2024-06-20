import * as EFS from "expo-file-system";

export type FileInfo = EFS.FileInfo & { name: string };

type FileContent = FileInfo & { content: string };

type DirectoryInfo = {
  directories: FileInfo[];
  files: FileInfo[];
};

export type DirectoryContent = {
  directories: FileInfo[];
  files: FileContent[];
};

const BASE_DIRECTORY_INFO: FileInfo = {
  name: "",
  exists: false,
  isDirectory: false,
  uri: EFS.documentDirectory as string,
};

const BASE_DIRECTORY_CONTENT: DirectoryContent = {
  files: [],
  directories: [],
};

export default class FS {
  static baseDirectoryInfo = BASE_DIRECTORY_INFO;
  static baseDirectoryContent = BASE_DIRECTORY_CONTENT;

  private directoryInfo: FileInfo;
  private directoryContent: DirectoryContent;

  private setDirectoryObservers: Array<(directory: FileInfo) => void>;
  private readDirectoryContentObservers: Array<
    (content: DirectoryContent) => void
  >;

  constructor() {
    this.setDirectoryObservers = [];
    this.readDirectoryContentObservers = [];

    this.directoryInfo = FS.baseDirectoryInfo;
    this.directoryContent = FS.baseDirectoryContent;
  }

  /**
   * PRIVATE METHODS
   */
  private async getInfoAsync(fileUri: string = ""): Promise<FileInfo> {
    const fileInfo = await EFS.getInfoAsync(this.directoryInfo.uri + fileUri);

    return {
      ...fileInfo,
      name: fileInfo.uri.split("/").pop()!,
    };
  }

  private async directoryExistsAsync(fileUri: string = ""): Promise<FileInfo> {
    let fileInfo = await this.getInfoAsync(fileUri);

    if (!fileInfo.exists) {
      await this.makeDirectoryAsync(fileUri);
      fileInfo = await this.getInfoAsync(fileUri);
    }

    return fileInfo;
  }

  private async readDirectoryAsync(): Promise<Array<string>> {
    return EFS.readDirectoryAsync(this.directoryInfo.uri);
  }

  private async readDirectoryInfoAsync(): Promise<DirectoryInfo> {
    const fileNames = await this.readDirectoryAsync();

    const fileInfo = await Promise.all(
      fileNames.map((name) => this.getInfoAsync(name))
    );

    return fileInfo.reduce<DirectoryInfo>(
      (acc, file) => {
        if (file.isDirectory) {
          acc.directories.push(file);
        } else {
          acc.files.push(file);
        }

        return acc;
      },
      { files: [], directories: [] }
    );
  }

  private notifySetDirectory() {
    this.setDirectoryObservers.forEach((observer) =>
      observer(this.directoryInfo)
    );
  }

  private notifyReadDirectoryContent() {
    this.readDirectoryContentObservers.forEach((observer) =>
      observer(this.directoryContent)
    );
  }

  /**
   * PUBLIC METHODS
   */
  async setDirectory(directory: string = ""): Promise<void> {
    this.directoryInfo = await this.directoryExistsAsync(directory);

    this.notifySetDirectory();
  }

  async readContentAsync(fileUri: string): Promise<string> {
    return EFS.readAsStringAsync(this.directoryInfo.uri + fileUri, {
      encoding: EFS.EncodingType.UTF8,
    });
  }

  async makeDirectoryAsync(fileUri: string = ""): Promise<void> {
    await EFS.makeDirectoryAsync(this.directoryInfo.uri + fileUri, {
      intermediates: true,
    });

    const directoryInfo = await this.getInfoAsync(fileUri);

    this.directoryContent.directories.push(directoryInfo);

    this.notifyReadDirectoryContent();
  }

  async deleteAsync(fileUri: string = ""): Promise<void> {
    const fileInfo = await this.getInfoAsync(fileUri);

    await EFS.deleteAsync(this.directoryInfo.uri + fileUri, {
      idempotent: true,
    });

    const matchUri = (dir: FileInfo) => dir.uri === fileInfo.uri;

    if (fileInfo.isDirectory) {
      const index = this.directoryContent.directories.findIndex(matchUri);
      this.directoryContent.directories.splice(index, 1);
    } else {
      const index = this.directoryContent.files.findIndex(matchUri);
      this.directoryContent.files.splice(index, 1);
    }

    this.notifyReadDirectoryContent();
  }

  async writeContentAsync(fileUri: string, contents: string): Promise<void> {
    await EFS.writeAsStringAsync(this.directoryInfo.uri + fileUri, contents, {
      encoding: EFS.EncodingType.UTF8,
    });

    const fileInfo = await this.getInfoAsync(fileUri);

    const file = this.directoryContent.files.find(
      (file) => file.uri === fileInfo.uri
    );

    if (file) {
      file.content = contents;
    } else {
      this.directoryContent.files.push({
        ...fileInfo,
        content: contents,
      });
    }

    this.notifyReadDirectoryContent();
  }

  async readDirectoryContentAsync(): Promise<void> {
    const fileInfo = await this.readDirectoryInfoAsync();

    const files = await Promise.all(
      fileInfo.files.map(async (file) => ({
        ...file,
        content: await this.readContentAsync(file.uri),
      }))
    );

    this.directoryContent = {
      files,
      directories: fileInfo.directories,
    };

    this.notifyReadDirectoryContent();
  }

  onSetDirectory(observer: (directory: FileInfo) => void) {
    this.setDirectoryObservers.push(observer);

    return () => {
      const index = this.setDirectoryObservers.indexOf(observer);
      this.setDirectoryObservers.splice(index, 1);
    };
  }

  onReadDirectoryContent(observer: (content: DirectoryContent) => void) {
    this.readDirectoryContentObservers.push(observer);

    return () => {
      const index = this.readDirectoryContentObservers.indexOf(observer);
      this.readDirectoryContentObservers.splice(index, 1);
    };
  }
}
