import mongoose from "mongoose";

export interface IUser {
    id: string,

    username: string,
    avatar: string,
    discriminator: string,

    last_user_sync?: number,
}

const UserSchema = new mongoose.Schema<IUser>({
    id: { type: String, required: true },

    username: { type: String, required: true },
    avatar: { type: String, required: true },
    discriminator: { type: String, required: true },

    last_user_sync: { type: Number, required: false, default: Date.now() },
});

const UserModel = mongoose.model<IUser>('User', UserSchema);
export default UserModel;