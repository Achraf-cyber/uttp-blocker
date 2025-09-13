
const url = "https://achraf-cyber.github.io/extension/uttp_blocker/uttp_signature.json";



export const channelsBlackList = new Set([
    "@UTTPGodOfTheUnderworld",
    "@UTTPdavid",
    "@UTTPSovietOfficerBogdan",
    "@UTTPOfficerX7",
    "@UTTP-Assistant",
    "@Dontreadmypicture602",
    "@Lzevin",
    "@idrk_gd",
    "@UTTPNooireDusk",
    "@DontReadMyPicture12",
    "@ReturnOfDrakeJalaya",
    "@KandersV3",
    "@SeizureExE999",
    "@HANDS.OFF.GABRIELA",
    "@ivanpavic77",
    "@MustardBoi-s9x",
    "@LIiiRwoodKevs",
    "@UTTPOfficerFogger",
]);


export function loadChannelsBlacklist(): Promise<Set<string>> {
    return new Promise((resolve) => {
        resolve(channelsBlackList);
    });
}
export function loadForbidenWords(): Promise<Set<string>> {
    return new Promise((resolve) => {
        resolve(new Set(['uttp', "sybau", "bots"]));
    });
}
export function loadForbidenComments(): Promise<Set<RegExp>> {
    return new Promise((resolve) => {
        resolve(new Set());
    });
}