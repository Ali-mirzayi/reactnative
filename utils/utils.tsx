export const generateID = () => Math.random().toString(36).substring(2, 10);

export const time = (date: string | undefined) => {
    if (date === undefined) return;
    const ms = new Date(date);
    const hour =
        ms.getHours() < 10
            ? `0${ms.getHours()}`
            : `${ms.getHours()}`;

    const mins =
        ms.getMinutes() < 10
            ? `0${ms.getMinutes()}`
            : `${ms.getMinutes()}`;
    return `${hour}:${mins}`
};

export const formatMillisecondsToTime = (durationSeconds: number | undefined) => {
    if (durationSeconds === undefined) return;
    const minutes = Math.floor(durationSeconds / 60);
    const seconds = durationSeconds % 60;
    const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
    const formattedSeconds = seconds < 10 ? '0' + seconds : seconds;

    return `${formattedMinutes}:${formattedSeconds}`;
}

export const isMusicFile = (filename: string | undefined) => {
    if (filename === undefined) return;
    const musicExtensions = ['.mp3', '.wav', '.aac', '.flac', '.ogg', '.m4a'];  
    const lowerCaseFilename = filename.toLowerCase();  
    return musicExtensions.some(extension => lowerCaseFilename.endsWith(extension));
};  