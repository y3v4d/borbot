enum Code {
    INTERNAL_SERVER_ERROR = 0,
    NO_RESPONSE = 1,

    DISCORD_API_ERROR = 2,
    DISCORD_INVALID_TOKEN = 3,
    DISCORD_RATE_LIMIT = 4,

    CLICKERHEROES_API_ERROR = 5,
    CLICKERHEROES_API_FAILED = 6,

    TOKEN_ERROR = 7,

    OK = 200,
    BAD_REQUEST = 400,

    USER_NO_TOKEN = 1000,
    USER_NOT_REGISTERED = 1001,
    USER_NOT_IN_GUILD = 1002,
    USER_NOT_AN_ADMIN = 1003,

    GUILD_REQUIRES_BOT = 2000,
    GUILD_ALREADY_SETUP = 2001,
    GUILD_NOT_SETUP = 2002,
    GUILD_NO_SCHEDULE = 2003,
    
    CLAN_INVALID_CREDENTIALS = 3000,

    MEMBER_NOT_EXIST = 4000
}

export const CodeMessage: { [key: number]: string } = {
    [Code.USER_NO_TOKEN]: 'Path requires authorization',
    [Code.USER_NOT_REGISTERED]: 'User not registered',
    [Code.USER_NOT_IN_GUILD]: 'User is not in guild',
    [Code.USER_NOT_AN_ADMIN]: 'User is not an admin',
    [Code.GUILD_REQUIRES_BOT]: 'Guild required bot',
    [Code.GUILD_ALREADY_SETUP]: 'Guild already setup',
    [Code.GUILD_NOT_SETUP]: "Guild isn't setup",
    [Code.GUILD_NO_SCHEDULE]: "Guild doesn't have schedule",
    [Code.CLAN_INVALID_CREDENTIALS]: 'Invalid clan credentials',
    [Code.MEMBER_NOT_EXIST]: 'Member do not exist'
};

export default Code;