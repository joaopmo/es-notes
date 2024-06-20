import * as EFS from "expo-file-system";

export type FileInfo = EFS.FileInfo & { name: string };
export type FileContent = FileInfo & { content: string };

export type DirectoryInfo = {
  directories: FileInfo[];
  files: FileInfo[];
};

export type DirectoryContent = {
  directories: FileInfo[];
  files: FileContent[];
};

export default class SA {
  static markdownDirectory = "md/";

  static async getInfoAsync(fileUri: string) {
    return EFS.getInfoAsync(fileUri);
  }

  static requestDirectoryPermissionsAsync() {
    return EFS.StorageAccessFramework.requestDirectoryPermissionsAsync();
  }
}
