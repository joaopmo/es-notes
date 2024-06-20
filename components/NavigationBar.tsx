import { StackHeaderProps } from "@react-navigation/stack";
import { Appbar } from "react-native-paper";

export default function NavigationBar({ options }: StackHeaderProps) {
  return (
    <Appbar.Header>
      <Appbar.Content title={options.title} />
    </Appbar.Header>
  );
}
