import React, { createContext, useState } from "react";
import {
  Button,
  Dialog,
  Portal,
  Text,
  TextInput,
  type TextProps,
  type TextInputProps,
} from "react-native-paper";

type ContentNodeProps =
  | {
      textProps: TextProps<string>;
      textInputProps?: Omit<TextInputProps, "value" | "onChangeText">;
    }
  | {
      textProps?: TextProps<string>;
      textInputProps: Omit<TextInputProps, "value" | "onChangeText">;
    };

function isValidTextProps(
  props?: TextProps<string>
): props is TextProps<string> {
  return props != null && props !== initialDialogOptions.textProps;
}

function isValidtextInputProps(
  props?: TextInputProps
): props is TextInputProps {
  return props != null && props !== initialDialogOptions.textInputProps;
}

type DialogOptions = {
  title: string;
} & ContentNodeProps;

type ResolveParam = string | null;

interface PromiseInfo {
  resolve: (value: ResolveParam) => void;
  reject: (reason?: any) => void;
}

type ShowDialogHandler = (options: DialogOptions) => Promise<ResolveParam>;

const DialogContext = createContext<ShowDialogHandler>(() => {
  throw new Error("Component is not wrapped with a DialogProvider.");
});

const initialDialogOptions: DialogOptions = {
  title: "",
  textProps: {
    children: null,
  },
  textInputProps: {},
};

const initialPromiseInfo: PromiseInfo = {
  resolve: () => {
    console.error("resolve() called before promise was created.");
  },
  reject: () => {
    console.error("reject() called before promise was created.");
  },
};

interface DialogProviderProps {
  children: React.ReactNode;
}

export function DialogProvider({ children }: DialogProviderProps) {
  const [text, setText] = useState("");
  const [visible, setVisible] = useState(false);
  const [type, setType] = useState<"text" | "input" | null>(null);
  const [options, setOptions] = useState<DialogOptions>(initialDialogOptions);
  const [promiseInfo, setPromiseInfo] =
    useState<PromiseInfo>(initialPromiseInfo);

  const showDialog: ShowDialogHandler = (options) => {
    return new Promise<ResolveParam>((resolve, reject) => {
      if (isValidtextInputProps(options.textInputProps)) setType("input");
      else if (isValidTextProps(options.textProps)) setType("text");
      setPromiseInfo({ resolve, reject });
      setOptions(options);
      setVisible(true);
    });
  };

  const reset = () => {
    setText("");
    setType(null);
    setOptions(initialDialogOptions);
    setPromiseInfo(initialPromiseInfo);
  };

  const handleConfirm = () => {
    setVisible(false);
    promiseInfo.resolve(type === "text" ? "ok" : text);
    reset();
  };
  const handleCancel = () => {
    setVisible(false);
    promiseInfo.resolve(null);
    reset();
  };

  return (
    <>
      <Portal>
        <Dialog visible={visible} dismissable={false}>
          <Dialog.Title>{options.title}</Dialog.Title>
          <Dialog.Content>
            <DialogContent
              text={text}
              onChangeText={(text) => setText(text)}
              options={options}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={handleCancel}>Cancelar</Button>
            <Button
              onPress={handleConfirm}
              disabled={type === "input" && !text}
            >
              Confirmar
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      <DialogContext.Provider value={showDialog}>
        {children}
      </DialogContext.Provider>
    </>
  );
}

interface DialogContentProps {
  text: string;
  options: DialogOptions;
  onChangeText: (text: string) => void;
}

function DialogContent({ text, options, onChangeText }: DialogContentProps) {
  if (isValidTextProps(options.textProps)) {
    return <Text {...options.textProps} />;
  }

  if (isValidtextInputProps(options.textInputProps)) {
    return (
      <TextInput
        {...options.textInputProps}
        value={text}
        onChangeText={onChangeText}
      />
    );
  }

  return null;
}

export function useDialog(): ShowDialogHandler {
  return React.useContext(DialogContext);
}
