import { useEffect } from "react";
import * as FileSystem from "expo-file-system";
import { ScrollView, Text } from "react-native";

export default function Index() {
  useEffect(() => {
    console.log(FileSystem.documentDirectory);
  }, []);

  return (
    <ScrollView>
      <Text>{FileSystem.documentDirectory}</Text>
    </ScrollView>
  );
}

// export default function Index() {
//   const [created, setCreated] = useState(false);
//   const [fileContent, setFileContent] = useState<Array<FileContent>>([]);

//   useEffect(() => {
//     if (fileContent.length === 0) {
//       for (let i = 0; i < 10; i++) {
//         SA.requestDirectoryPermissionsAsync()
//           .then(console.log)
//           .catch(console.error);

//         FS.writeContentAsync(
//           FS.markdownDirectory + `hello-${i}.txt`,
//           "#".repeat(Math.min(i + 1, 6)) + ` Hello, world! \n`.repeat(i + 1)
//         )
//           .then(console.log)
//           .catch(console.error);
//       }
//       setCreated(true);
//     }
//   }, []);

//   useEffect(() => {
//     if (created) {
//       FS.readDirectoryContentAsync(FS.markdownDirectory)
//         .then(({ directories, files }) => {
//           setFileContent(files);
//         })
//         .catch(console.error);
//     }
//   }, [created]);

//   return (
//     <ScrollView>
//       {fileContent.map((content) => (
//         <FileCard
//           title={content.name}
//           content={content.content}
//           key={content.uri}
//         />
//       ))}
//     </ScrollView>
//   );
// }
