import mongoose from "mongoose";

export interface IUserGuild {
    id: string, 
    name: string, 
    icon: string, 
    permissions: string,
    isAdmin: boolean
}

export interface IUser {
    id: string,
    token: string,

    guilds?: mongoose.Types.DocumentArray<IUserGuild>,
    last_update_guilds?: number
}

const UserSchema = new mongoose.Schema<IUser>({
    id: { type: String, required: true },
    token: { type: String, required: true },
    guilds: {
        type: [{
            id: String,
            name: String,
            icon: String,
            permissions: String,
            isAdmin: Boolean 
        }],
        required: false
    },
    last_update_guilds: { type: Number, required: false }
});

const UserModel = mongoose.model<IUser>('User', UserSchema);
export default UserModel;