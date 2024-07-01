import { NativeStackHeaderProps } from "@react-navigation/native-stack";
import { Appbar } from "react-native-paper";

export default function NavigationBar({ options }: NativeStackHeaderProps) {
  return (
    <Appbar.Header>
      <Appbar.Content title={options.headerTitle} />
    </Appbar.Header>
  );
}
