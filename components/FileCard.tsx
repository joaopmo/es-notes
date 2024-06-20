import React from "react";
import { Card, Text, useTheme } from "react-native-paper";
import Markdown from "react-native-markdown-display";

interface FileCardProps {
  title: string;
  content: string;
}

export default function FileCard({ title, content }: FileCardProps) {
  const theme = useTheme();

  return (
    <Card>
      <Card.Content>
        <Text>{content}</Text>
      </Card.Content>
      <Card.Title
        title={title}
        titleStyle={{ color: theme.colors.primary }}
        titleVariant="titleMedium"
      />
    </Card>
  );
}
