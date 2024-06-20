import React from "react";
import FS, { DirectoryContent, FileInfo } from "@/storage/file-system";

export interface FileSystemState {
  directoryInfo: FileInfo;
  isLoadingContent: boolean;
  directoryContent: DirectoryContent;
  setCurrentDirectory: (directory?: string) => Promise<void>;
}

type Action =
  | { type: "SET_DIRECTORY_INFO"; payload: FileInfo }
  | { type: "SET_DIRECTORY_CONTENT"; payload: DirectoryContent };

function reducer(state: FileSystemState, action: Action) {
  switch (action.type) {
    case "SET_DIRECTORY_INFO":
      return {
        ...state,
        isLoadingContent: true,
        directoryInfo: action.payload,
        directoryContent: FS.baseDirectoryContent,
      };
    case "SET_DIRECTORY_CONTENT":
      return {
        ...state,
        isLoadingContent: false,
        currentDirectoryContent: action.payload,
      };
    default:
      return state;
  }
}

const FileSystemContext = React.createContext({} as FileSystemState);

interface FileSystemProviderProps {
  children: React.ReactNode;
}

export default function FileSystemProvider({
  children,
}: FileSystemProviderProps) {
  const fileSystem = React.useMemo(() => new FS(), []);

  const [state, dispatch] = React.useReducer(reducer, {
    isLoadingContent: true,
    directoryInfo: FS.baseDirectoryInfo,
    directoryContent: FS.baseDirectoryContent,
    setCurrentDirectory: (directory?: string) => {
      return fileSystem.setDirectory(directory);
    },
  });

  React.useEffect(() => {
    const unsubscriptionFunctions = [
      fileSystem.onSetDirectory((directoryInfo) => {
        dispatch({ type: "SET_DIRECTORY_INFO", payload: directoryInfo });
      }),
      fileSystem.onReadDirectoryContent((directoryContent) => {
        dispatch({ type: "SET_DIRECTORY_CONTENT", payload: directoryContent });
      }),
    ];

    fileSystem.setDirectory("md/");

    return () => {
      unsubscriptionFunctions.forEach((func) => func());
    };
  }, [fileSystem]);

  return (
    <FileSystemContext.Provider value={state}>
      {children}
    </FileSystemContext.Provider>
  );
}
