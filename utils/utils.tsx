export const generateID = () => Math.random().toString(36).substring(2, 10);

export const time = (date: string | undefined) => {
    if (date !== undefined) {
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
    }
};