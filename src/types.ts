export interface BlacklistConfig {
  channelsBlackList: string[];
  forbiddenWord: string[];
  forgivableWords: string[];
  forbiddenComments: string[]; 
  forbidenWordInChannel: string[]; 
}

export interface CompiledBlacklist {
  channels: Set<string>;
  words: Set<string>;
  softWords: Set<string>;
  forbidenWordInChannel: Set<string>;
  regex: RegExp[];
}

export interface Filters {
  charactersFilter: boolean;
  blockedChannels: boolean;
  forbiddenWordsInChannelName: boolean;
  forbiddenWordsInComment: boolean;
  filterSoftWordsInComment: boolean;
  forbiddenCommentPatterns: boolean;
}

export interface UserPreferences {
  filters: Filters;
}