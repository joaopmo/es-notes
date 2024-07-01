import * as EFS from "expo-file-system";

export type FileSystemDriver = {
  documentDirectory: string | null;
  EncodingType: typeof EFS.EncodingType;
  getInfoAsync: (fileUri: string) => Promise<EFS.FileInfo>;
  readDirectoryAsync: (fileUri: string) => Promise<string[]>;
  deleteAsync: (fileUri: string, options: EFS.DeletingOptions) => Promise<void>;
  makeDirectoryAsync: (
    fileUri: string,
    options: EFS.MakeDirectoryOptions
  ) => Promise<void>;
  readAsStringAsync: (
    fileUri: string,
    options: EFS.ReadingOptions
  ) => Promise<string>;
  writeAsStringAsync: (
    fileUri: string,
    content: string,
    options: EFS.WritingOptions
  ) => Promise<void>;
};

export type FileInfo = EFS.FileInfo & { name: string };

type FilePreview = FileInfo & { preview: string };

type DirectoryInfo = {
  directories: FileInfo[];
  files: FileInfo[];
};

type DirectoryContent = {
  directories: FileInfo[];
  files: FilePreview[];
};

export type FSState = {
  directoryInfo: FileInfo;
  directoryContent: DirectoryContent;
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

interface ConstructorSettings {
  driver?: FileSystemDriver;
  previewSize?: number;
}

export default class FS {
  private _driver: FileSystemDriver;
  private _initialized: boolean;
  private _previewSize: number;
  private _directoryInfo: FileInfo;
  private _directoryContent: DirectoryContent;

  private _baseDirectoryInfo = BASE_DIRECTORY_INFO;
  private _baseDirectoryContent = BASE_DIRECTORY_CONTENT;

  constructor(
    settings: ConstructorSettings = { driver: EFS, previewSize: 100 }
  ) {
    this._driver = settings.driver ?? EFS;
    this._initialized = false;
    this._previewSize = settings.previewSize ?? 100;

    this._directoryInfo = this._baseDirectoryInfo;
    this._directoryContent = this._baseDirectoryContent;
  }

  /**
   * PRIVATE METHODS
   */
  private async _getInfoAsync(fileUri: string): Promise<FileInfo> {
    const fileInfo = await this._driver.getInfoAsync(fileUri);

    let name: string = "";

    if (!fileInfo.exists) {
      return { ...fileInfo, name };
    }

    if (fileInfo.isDirectory) {
      fileInfo.uri += fileInfo.uri.endsWith("/") ? "" : "/";
      name = fileInfo.uri.split("/").at(-2)!;
    } else {
      name = fileInfo.uri.split("/").pop()!;
    }

    return { ...fileInfo, name };
  }

  private async _directoryExistsAsync(fileName: string): Promise<FileInfo> {
    const fileUri = this._directoryInfo.uri + fileName;

    let fileInfo = await this._getInfoAsync(fileUri);

    if (!fileInfo.exists) {
      await this._driver.makeDirectoryAsync(fileUri, { intermediates: true });
      fileInfo = await this._getInfoAsync(fileUri);
    }

    return fileInfo;
  }

  private async _readDirectoryAsync(): Promise<string[]> {
    return this._driver.readDirectoryAsync(this._directoryInfo.uri);
  }

  private async _readDirectoryInfoAsync(): Promise<DirectoryInfo> {
    const fileNames = await this._readDirectoryAsync();

    const fileInfo = await Promise.all(
      fileNames.map((name) =>
        this._getInfoAsync(this._directoryInfo.uri + name)
      )
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

  private async _readDirectoryContentAsync(): Promise<DirectoryContent> {
    const fileInfo = await this._readDirectoryInfoAsync();

    const files = await Promise.all(
      fileInfo.files.map(async (file) => {
        const preview = await this.readContentAsync(file.name);

        return {
          ...file,
          preview: preview.slice(0, this._previewSize),
        };
      })
    );

    return {
      files,
      directories: fileInfo.directories,
    };
  }

  private async _removeOneAsync(fileName: string): Promise<void> {
    const fileUri = this._directoryInfo.uri + fileName;

    const fileInfo = await this._getInfoAsync(fileUri);

    await this._driver.deleteAsync(fileUri, { idempotent: true });

    const matchUri = (dir: FileInfo) => dir.uri === fileInfo.uri;

    if (fileInfo.isDirectory) {
      const index = this._directoryContent.directories.findIndex(matchUri);
      this._directoryContent.directories.splice(index, 1);
    } else {
      const index = this._directoryContent.files.findIndex(matchUri);
      this._directoryContent.files.splice(index, 1);
    }
  }

  private _directory(): FSState {
    return {
      directoryInfo: this._directoryInfo,
      directoryContent: this._directoryContent,
    };
  }

  /**
   * GETTERS
   */
  get baseDirectoryInfo() {
    return this._baseDirectoryInfo;
  }

  get baseDirectoryContent() {
    return this._baseDirectoryContent;
  }

  /**
   * PUBLIC METHODS
   */
  async init(fileName: string): Promise<FSState> {
    if (this._directoryInfo === this._baseDirectoryInfo) {
      this._directoryInfo = await this._directoryExistsAsync(fileName);
      this.baseDirectoryInfo.uri = this._directoryInfo.uri;
    }

    this._directoryContent = await this._readDirectoryContentAsync();
    this._initialized = true;

    return this._directory();
  }

  async setDirectory(fileUri: string): Promise<FSState> {
    if (!this._initialized) {
      return this._directory();
    }

    this._directoryInfo = await this._getInfoAsync(fileUri);
    this._directoryContent = await this._readDirectoryContentAsync();

    return this._directory();
  }

  async makeDirectoryAsync(fileName: string): Promise<FSState> {
    if (!this._initialized) {
      return this._directory();
    }

    const fileUri = this._directoryInfo.uri + fileName;

    await this._driver.makeDirectoryAsync(fileUri, { intermediates: true });

    const fileInfo = await this._getInfoAsync(fileUri);

    this._directoryContent.directories.push(fileInfo);

    return this._directory();
  }

  async writeContentAsync(fileName: string, content: string): Promise<FSState> {
    if (!this._initialized) {
      return this._directory();
    }

    const fileUri = this._directoryInfo.uri + fileName;

    await this._driver.writeAsStringAsync(fileUri, content, {
      encoding: this._driver.EncodingType.UTF8,
    });

    const file = this._directoryContent.files.find(
      (file) => file.uri === fileUri
    );

    if (file) {
      file.preview = content.slice(0, this._previewSize);
    } else {
      const fileInfo = await this._getInfoAsync(fileUri);
      this._directoryContent.files.push({
        ...fileInfo,
        preview: content.slice(0, this._previewSize),
      });
    }

    return this._directory();
  }

  async removeAsync(fileNames: string | string[]): Promise<FSState> {
    if (!this._initialized) {
      return this._directory();
    }

    const isArray = Array.isArray(fileNames);

    if (isArray) {
      await Promise.all(
        fileNames.map((fileName) => this._removeOneAsync(fileName))
      );
    } else {
      await this._removeOneAsync(fileNames);
    }

    return this._directory();
  }

  async readContentAsync(fileName: string): Promise<string> {
    const fileUri = this._directoryInfo.uri + fileName;

    return this._driver.readAsStringAsync(fileUri, {
      encoding: this._driver.EncodingType.UTF8,
    });
  }
}
