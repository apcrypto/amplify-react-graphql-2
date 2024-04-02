import React, { useState, useEffect } from "react";
import "./App.css";
import "@aws-amplify/ui-react/styles.css";
import { Amplify } from 'aws-amplify';
import {
  Button,
  Flex,
  Heading,
  Image,
  Text,
  TextField,
  View,
  withAuthenticator,
} from "@aws-amplify/ui-react";
import { listNotes } from "./graphql/queries";
import {
  createNote as createNoteMutation,
  deleteNote as deleteNoteMutation,
} from "./graphql/mutations";
import { generateClient } from 'aws-amplify/api';
import { uploadData, getUrl, remove, list } from 'aws-amplify/storage';
import { StorageImage } from '@aws-amplify/ui-react-storage';
import '@aws-amplify/ui-react/styles.css';

try {
  const result = await list({
    prefix: 'photos/'
  });
} catch (error) {
  console.log(error);
}


const client = generateClient();

const App = ({ signOut }) => {
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    fetchNotes();
  }, []);

  async function fetchNotes() {
    const apiData = await client.graphql({ query: listNotes });
    const notesFromAPI = apiData.data.listNotes.items;
    await Promise.all(
      notesFromAPI.map(async (note) => {
        if (note.image) {
          const getUrlResult = await getUrl({
            key: note.image,
          });

          // try {
          //   const response = await list({
          //     prefix: 'photos/',
          //     options: {
          //       listAll: true
          //     }
          //   });
          //   console.log(response)
          //   // render list items from response.items
          // } catch (error) {
          //   console.log('Error ', error);
          // }
    
          // note.image = getUrlResult.url.toString();
        }
        // console.log(await Amplify.Storage.list({
        //       prefix: 'photos/',
        //       options: {
        //         listAll: true
        //       }
        //     }).result)
        return note;
      })
    );
    setNotes(notesFromAPI);
  }

  async function createNote(event) {
    event.preventDefault();
    const form = new FormData(event.target);
    const image = form.get("image");
    const data = {
      name: form.get("name"),
      description: form.get("description"),
      image: image.name,
    };
    if (!!data.image) 
    try {
      const result = await uploadData({
        key: data.name,
        data: image,
        options: {
          accessLevel: 'guest', // defaults to `guest` but can be 'private' | 'protected' | 'guest'
        }
      }).result;
      console.log('Succeeded: ', result);
    } catch (error) {
      console.log('Error : ', error);
    }

    await client.graphql({
      query: createNoteMutation,
      variables: { input: data },
    });
    fetchNotes();
    event.target.reset();
  }

  async function deleteNote({ id, name }) {
    const newNotes = notes.filter((note) => note.id !== id);
    setNotes(newNotes);
    try {
      await remove({ key: name });
    } catch (error) {
      console.log('Error ', error);
    }
    await client.graphql({
      query: deleteNoteMutation,
      variables: { input: { id } },
    });
  }

  const DefaultStorageImageExample = () => {
  return <StorageImage alt="list image" imgKey="BAD_AD.jpg" accessLevel="guest" />;
};

  return (
    <View className="App">
      <Heading level={1}>My Notes App</Heading>
      <View as="form" margin="3rem 0" onSubmit={createNote}>
        <Flex direction="row" justifyContent="center" alignItems="end">
          <TextField
            name="name"
            placeholder="Note Name"
            label="Note Name"
            labelHidden
            variation="quiet"
            required
          />
          <TextField
            name="description"
            placeholder="Note Description"
            label="Note Description"
            labelHidden
            variation="quiet"
            required
          />
          <View
            name="image"
            as="input"
            type="file"
            style={{ alignSelf: "end" }}
          />
          {/* <DefaultStorageImageExample/> */}
          <Button type="submit" variation="primary">
            Create Note
          </Button>
        </Flex>
      </View>
      <Heading level={2}>Current Notes</Heading>
      <View margin="3rem 0">
      {notes.map((note) => (
      <Flex
        key={note.id || note.name}
        direction="row"
        justifyContent="center"
        alignItems="center"
      >
        <Text as="strong" fontWeight={700}>
          {note.name}
        </Text>
        <Text as="span">{note.description}</Text>
        {note.image && (
          <Image
            src={note.image}
            alt={`visual aid for ${notes.name}`}
            style={{ width: 400 }}
          />
        )}
        <Button variation="link" onClick={() => deleteNote(note)}>
          Delete note
        </Button>
       </Flex>
      ))}
      </View>
      <Button onClick={signOut}>Sign Out</Button>
    </View>
  );
};

export default withAuthenticator(App);