export const generateRequestCode = () => {
    return `REQ-${Math.floor(100000 + Math.random() * 900000)}`;
}