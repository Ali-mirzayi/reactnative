import { DefaultTheme, DarkTheme } from '@react-navigation/native';
import { storage } from '../mmkv';

const lightTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: "#EEF1FF",
      text: "#212A3E",
      card:"#F9F7F7",
      mirza:"#3F72AF",
      undetlay:"#b2c6df",
      loginMirza:"#00402f",
      boarder:"#b2c6df",
      red:"#DE3163"
    },
  };
  
const darkTheme = {
    ...DarkTheme,
    colors: {
        ...DefaultTheme.colors,
        background: "#212A3E",
        text: "#F1F6F9",
        card:"#415266",
        mirza:"#8baacf",
        undetlay:"#353d4f",
        loginMirza:"#508081",
        boarder:"#ccc",
        red:"#FF033E"
    }

};

const useTheme = () => {
  const darkMode = storage.getBoolean("darkMode");
  if(darkMode){
    return darkTheme
  }else{
    return lightTheme
  }
}

export {lightTheme,darkTheme}

export default useTheme;


// in my code i upload a video
// const multer = require('multer');
// const storage = multer.diskStorage({
// 	destination: 'uploads/',
// 	filename: function (req, file, cb) {
// 		cb(null, Date.now() + path.extname(file.originalname)) //Appending extension
// 	}
// });

// const upload = multer({ storage }); 
//   app.post("/upload", upload.any(), (req, res) => {
// 	const uploadedFile = req.files[0];
// 	filePath = uploadedFile.path;
// 	res.end("ok")
// });
// then i takescreenshot i want wait for upload finished and then write in uploads directory is finished then takescreenshot
// socket.on('sendVideo', (data) => {
//   const { roomId, ...newMessage } = data;
//   const filename = `${Date.now()}.jpg`;
//   ffmpeg({
//     source: filePath,
//   }).takeScreenshots({
//     filename,
//     timemarks: [10],
//     folder: "uploads/",
//   });
//   socket.in(roomId).emit('newMessage', { ...newMessage, video: filePath, thumbnail: filename });
// });
