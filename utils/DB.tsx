import * as FileSystem from 'expo-file-system';
import * as SQLite from 'expo-sqlite';
import { Room } from "./types";

export const getDBConnection = () => {
  return SQLite.openDatabase('db.db');
};

export const createTable = () => {
  const db = getDBConnection();
  return db.transaction(tx => {
    tx.executeSql('CREATE TABLE IF NOT EXISTS rooms (id TEXT PRIMARY KEY NOT NULL, data TEXT NOT NULL)',
    [],
    () => {console.log("table created")},
    (_, error):any => {console.log(error)}
    )
  });
};

export const insertRoom = (room:Room) => {
  const db = getDBConnection();
  return db.transaction(tx => {
    tx.executeSql(`INSERT OR IGNORE INTO rooms (id, data) VALUES (?, ?)`,
    [JSON.stringify(room.id), JSON.stringify(room)],
    (_,{rows}) => {console.log("inserted")},
    (_, error):any => {console.log(error,'insertRoom')}
    )
  });
};

export const UpdateMessage = (data:Room) => {
  const db = getDBConnection();
  return db.transaction(tx => {
    tx.executeSql(`UPDATE rooms SET data = ? WHERE id = ?`,
    [JSON.stringify(data),JSON.stringify(data.id)],
    () => {console.log('Update')},
    (_, error):any => {console.log(error,'UpdateMessage')}
    );
  });
};

export const getAllRooms = () => {
  const db = getDBConnection();
  return new Promise((resolve, reject) => {
  db.transaction(tx => {
    tx.executeSql('SELECT data FROM rooms',
    [],
    (_,{rows}) => {
      resolve(rows._array)
    },
    (_, error):any => reject(error)
    );
  })
  // @ts-ignore
  error => {
    console.log(error);
    reject(error);
  }
})
};

export const getRoom = (id:string) => {
  const db = getDBConnection();
  return new Promise((resolve, reject) => {
  db.transaction(tx => {
    tx.executeSql(`SELECT data FROM rooms WHERE id = ?`,
    [JSON.stringify(id)],
    (_,{rows}) => {
      resolve(rows._array)
    },
    (_, error):any => reject(error)
    );
  });
    // @ts-ignore
    error => {
      reject(error);
    }
 })
};

export const deleteRooms = () => {
  const db = getDBConnection();
  db.transaction(tx => {
    tx.executeSql('DROP TABLE rooms',
    [],
    async(_,{rows}) => {
      console.log('deleted');
    },
    (_, error):any => console.log(error)
    )
  });

}