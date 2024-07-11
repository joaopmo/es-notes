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

  private _baseDirectoryInfo: FileInfo;
  private _baseDirectoryContent: DirectoryContent;

  constructor(
    settings: ConstructorSettings = { driver: EFS, previewSize: 100 }
  ) {
    this._driver = settings.driver ?? EFS;
    this._initialized = false;
    this._previewSize = settings.previewSize ?? 100;
    this._baseDirectoryInfo = { ...BASE_DIRECTORY_INFO };
    this._baseDirectoryContent = { files: [], directories: [] };
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

    fileInfo.uri = this._normalizeURIEncoding(fileInfo.uri);

    if (fileInfo.isDirectory) {
      fileInfo.uri = this._normalizeEndingSlash(fileInfo.uri);
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

  private async _makeOneDirectoryAsync(fileName: string): Promise<void> {
    const fileUri = this._directoryInfo.uri + fileName;

    await this._driver.makeDirectoryAsync(fileUri, { intermediates: true });

    const fileInfo = await this._getInfoAsync(fileUri);

    this._directoryContent.directories.push(fileInfo);
  }

  private _getDirectoryData(): FSState {
    return {
      directoryInfo: this._directoryInfo,
      directoryContent: this._directoryContent,
    };
  }

  private _normalizeEndingSlash(fileUri: string): string {
    return fileUri.replace(/\/*$/, "") + "/";
  }

  private _normalizeURIEncoding(fileUri: string): string {
    return this._encodeURI(this._decodeURI(fileUri));
  }

  private _encodeURI(fileUri: string): string {
    return encodeURI(fileUri);
  }

  private _decodeURI(fileUri: string): string {
    while (this._isEncodedURI(fileUri)) {
      fileUri = decodeURI(fileUri);
    }

    return fileUri;
  }

  private _isEncodedURI(fileUri: string): boolean {
    return fileUri !== decodeURI(fileUri);
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
      fileName = this._normalizeURIEncoding(fileName);
      this._directoryInfo = await this._directoryExistsAsync(fileName);
      this._baseDirectoryInfo = { ...this._directoryInfo };
    }

    this._directoryContent = await this._readDirectoryContentAsync();
    this._initialized = true;

    return this._getDirectoryData();
  }

  async setDirectory(fileUri: string): Promise<FSState> {
    if (!this._initialized) {
      return this._getDirectoryData();
    }

    this._directoryInfo = await this._getInfoAsync(fileUri);
    this._directoryContent = await this._readDirectoryContentAsync();

    return this._getDirectoryData();
  }

  async makeDirectoryAsync(fileNames: string | string[]): Promise<FSState> {
    if (!this._initialized) {
      return this._getDirectoryData();
    }

    if (Array.isArray(fileNames)) {
      await Promise.all(
        fileNames.map((fileName) => {
          return this._makeOneDirectoryAsync(
            this._normalizeURIEncoding(fileName)
          );
        })
      );
    } else {
      await this._makeOneDirectoryAsync(this._normalizeURIEncoding(fileNames));
    }

    return this._getDirectoryData();
  }

  async writeContentAsync(
    fileName: string,
    content: string = ""
  ): Promise<FSState> {
    if (!this._initialized) {
      return this._getDirectoryData();
    }
    fileName = this._normalizeURIEncoding(fileName);
    const fileUri = this._directoryInfo.uri + fileName;

    await this._driver.writeAsStringAsync(fileUri, content, {
      encoding: this._driver.EncodingType.UTF8,
    });

    const fileInfo = await this._getInfoAsync(fileUri);
    const file = this._directoryContent.files.find(
      (file) => file.uri === fileInfo.uri
    );

    if (file) {
      file.preview = content.slice(0, this._previewSize);
    } else {
      this._directoryContent.files.push({
        ...fileInfo,
        preview: content.slice(0, this._previewSize),
      });
    }

    return this._getDirectoryData();
  }

  async removeAsync(fileNames: string | string[]): Promise<FSState> {
    if (!this._initialized) {
      return this._getDirectoryData();
    }

    if (Array.isArray(fileNames)) {
      await Promise.all(
        fileNames.map((fileName) => {
          return this._removeOneAsync(this._normalizeURIEncoding(fileName));
        })
      );
    } else {
      await this._removeOneAsync(this._normalizeURIEncoding(fileNames));
    }

    return this._getDirectoryData();
  }

  async readContentAsync(fileName: string): Promise<string> {
    fileName = this._normalizeURIEncoding(fileName);
    const fileUri = this._directoryInfo.uri + fileName;

    return this._driver.readAsStringAsync(fileUri, {
      encoding: this._driver.EncodingType.UTF8,
    });
  }
}
