import * as SQLite from 'expo-sqlite';
import { Room } from "./types";

export const getDBConnection = () => {
  return SQLite.openDatabaseAsync('db.db');
};

export const createTable = async () => {
  const db = await getDBConnection();
  await db.runAsync('PRAGMA journal_mode = WAL;').then((() => console.log("table PRAGMA")));
  await db.runAsync('CREATE TABLE IF NOT EXISTS rooms (id TEXT PRIMARY KEY NOT NULL, data TEXT NOT NULL);').then((() => console.log("table created"))).catch((error) => console.log(error, 'error creating table'));
};

export const insertRoom = async (room: Room) => {
  const db = await getDBConnection();
  await db.runAsync('INSERT OR IGNORE INTO rooms (id, data) VALUES (?, ?)', [JSON.stringify(room.id), JSON.stringify(room)]).then((() => console.log("table insertRoom"))).catch((error) => console.log(error, 'error insertRoom table'));
};

export const UpdateMessage = async (data: Room) => {
  const db = await getDBConnection();
  await db.runAsync('UPDATE rooms SET data = ? WHERE id = ?', [JSON.stringify(data), JSON.stringify(data.id)]);
};

export const getAllRooms = async () => {
  const db = await getDBConnection();
  return await db.getAllAsync<Room>('SELECT data FROM rooms');
};

export const getRoom = async (id: string) => {
  const db = await getDBConnection();
  return await db.getAllAsync<Room>('SELECT data FROM rooms WHERE id = ?', [JSON.stringify(id)]);
};

export const deleteDB = async () => {
  const db = await getDBConnection();
  return await db.runAsync('DROP TABLE IF EXISTS rooms').then((() => console.log("table dropped"))).catch((error) => console.log(error, 'error'));
}