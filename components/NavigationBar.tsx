import { Appbar } from "react-native-paper";
import { NativeStackHeaderProps } from "@react-navigation/native-stack";

export default function NavigationBar({ options }: NativeStackHeaderProps) {
  return (
    <Appbar.Header>
      <Appbar.Content title={options.title} />
    </Appbar.Header>
  );
}
