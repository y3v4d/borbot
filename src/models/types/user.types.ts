export interface IUser {
    id: string,

    username: string,
    avatar: string,
    discriminator: string,

    last_user_sync?: number,
}