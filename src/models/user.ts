import mongoose from "mongoose";
import { IUser } from "./types/user.types";

const UserSchema = new mongoose.Schema<IUser>({
    id: { type: String, required: true },

    username: { type: String, required: true },
    avatar: { type: String, required: true },
    discriminator: { type: String, required: true },

    last_user_sync: { type: Number, required: false, default: Date.now() },
});

const UserModel = mongoose.model<IUser>('User', UserSchema);
export default UserModel;