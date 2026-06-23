/**
 * @typedef {Object} Quest
 * @property {string} id
 * @property {string} title
 * @property {number} goal
 * @property {string} type
 * @property {number} progress
 * @property {boolean} done
 * @property {boolean} claimed
 */

/**
 * @typedef {Object} MetaState
 * @property {number} schemaVersion
 * @property {number} crystals
 * @property {number} skillPoints
 * @property {{ember:number,aerodynamics:number,warding:number,greed:number}} skills
 * @property {{classic:number,bossrush:number,daily:number,zen:number,hardcore:number}} bestScores
 * @property {string[]} unlockedSkins
 * @property {string} selectedSkin
 * @property {string[]} unlockedPets
 * @property {string} selectedPet
 * @property {Record<string, {at:number}>} achievements
 * @property {Record<string, {seen:number}>} bestiary
 * @property {Quest[] | null} quests
 * @property {string} lastQuestDate
 * @property {number} lastRunScore
 * @property {Array<{x:number,y:number}>} ghostTrace
 * @property {{score:number,mode:string,element:string} | null} ghostMeta
 * @property {Record<string, number>} dailyBestByDate
 * @property {Array<unknown>} replays
 * @property {number} highestLevelCleared
 * @property {number} totalLevelClears
 * @property {number} totalQuestsCompleted
 */

export {};
