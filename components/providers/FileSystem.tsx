import React, { createContext, useState, useCallback, useEffect } from "react";
import FS, { type FSState } from "@/storage/file-system";

const fs = new FS({ previewSize: 1000 });

type FileSystemState = FSState & { loading: boolean; initialized: boolean };

type FileSystemMethods = {
  remove: (fileNames: string | string[]) => void;
  setDirectory: (fileUri: string) => void;
  makeDirectory: (fileName: string) => void;
  readContentAsync: (fileName: string) => Promise<string>;
  writeContent: (fileName: string, content: string) => void;
};

const initialFS = {
  state: {
    loading: false,
    initialized: false,
    directoryInfo: fs.baseDirectoryInfo,
    directoryContent: fs.baseDirectoryContent,
  } as FileSystemState,
  methods: {} as FileSystemMethods,
};

export const FileSystemContext = createContext(initialFS);

interface FileSystemProviderProps {
  children: React.ReactNode;
}

export function FileSystemProvider({ children }: FileSystemProviderProps) {
  const [state, setState] = useState<FileSystemState>(initialFS.state);

  const stateLoading = useCallback(() => {
    setState((prevState) => ({ ...prevState, loading: true }));
  }, []);

  const stateUpdate = useCallback((fsState: FSState) => {
    setState((prevState) => ({
      ...prevState,
      ...fsState,
      loading: false,
      initialized: true,
    }));
  }, []);

  const readContentAsync = useCallback((fileName: string) => {
    return fs.readContentAsync(fileName);
  }, []);

  const setDirectory = useCallback(
    (fileUri: string) => {
      stateLoading();
      fs.setDirectory(fileUri).then(stateUpdate).catch(console.error);
    },
    [stateUpdate, stateLoading]
  );

  const makeDirectory = useCallback(
    (fileName: string) => {
      stateLoading();
      fs.makeDirectoryAsync(fileName).then(stateUpdate).catch(console.error);
    },
    [stateUpdate, stateLoading]
  );

  const writeContent = useCallback(
    (fileName: string, content: string) => {
      stateLoading();
      fs.writeContentAsync(fileName, content)
        .then(stateUpdate)
        .catch(console.error);
    },
    [stateUpdate, stateLoading]
  );

  const remove = useCallback(
    (fileNames: string | string[]) => {
      stateLoading();
      fs.removeAsync(fileNames).then(stateUpdate).catch(console.error);
    },
    [stateUpdate, stateLoading]
  );

  useEffect(() => {
    stateLoading();
    fs.init("md/").then(stateUpdate).catch(console.error);
  }, [stateLoading, stateUpdate]);

  return (
    <FileSystemContext.Provider
      value={{
        state,
        methods: {
          setDirectory,
          remove,
          readContentAsync,
          writeContent,
          makeDirectory,
        },
      }}
    >
      {children}
    </FileSystemContext.Provider>
  );
}

export function useFileSystemState() {
  const { state } = React.useContext(FileSystemContext);
  return state;
}

export function useFileSystemMethods() {
  const { methods } = React.useContext(FileSystemContext);
  return methods;
}
