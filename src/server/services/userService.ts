import DiscordAPI from "../../api/discord"
import { getGuildIconURL, isAdmin } from "../../shared/utils"

interface UserGuild {
    name: string,
    id: string,
    icon: string,
    permissions: string,
    isAdmin: boolean
}

class User {
    id: string = ""
    username: string = ""
    avatar: string = ""
    discriminator: string = ""

    token: string = ""

    private _guilds: UserGuild[] | null = null;

    constructor(token: string, data?: DiscordAPI.UserInformationResponse) {
        this.token = token;

        if(data) this.update(data);
    }

    async fetch() {
        try {
            const data = await DiscordAPI.getUserInformation(this.token);

            this.id = data.id;
            this.username = data.username;
            this.avatar = data.avatar;
            this.discriminator = data.discriminator;
        } catch(error: any) {
            console.log(error);
        }

        return this;
    }

    fetchGuilds() {
        return new Promise<UserGuild[]>((resolve, reject) => {
            const call = async () => {
                try {
                    const guilds = await DiscordAPI.getUserGuilds(this.token);
        
                    this._guilds = [];
                    for(const guild of guilds) {
                        this._guilds.push({
                            name: guild.name, 
                            id: guild.id, 
                            icon: getGuildIconURL(guild), 
                            permissions: guild.permissions,
                            isAdmin: isAdmin(guild.permissions)
                        });
                    }
                    
                    resolve(this._guilds);
                } catch(error: any) {
                    if(error.status == 429) {
                        const retry_after = error.data.retry_after;
                        console.log(`Rate limit hit, retrying after ${retry_after}`);
        
                        setTimeout(call, retry_after * 1000);
                    } else {
                        reject(error);
                    }
                }
            }
            
            call();
        });
    }

    update(data: DiscordAPI.UserInformationResponse) {
        this.id = data.id;
        this.username = data.username;
        this.avatar = data.avatar;
        this.discriminator = data.discriminator;
    }

    get guilds() {
        return this._guilds;
    }
}

class CUserService {
    private users: User[] = [];

    async fetchUser(token: string) {
        const cached = this.users.find(o => o.token === token);
        if(!cached) {
            const data = await DiscordAPI.getUserInformation(token);
            const user = new User(token, data);

            this.users.push(user);

            return user;
        }

        return await cached.fetch();
    }
}

const UserService = new CUserService();
export default UserService;