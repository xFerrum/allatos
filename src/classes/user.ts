export class User
{
    uid: string;
    email: string;
    username: string;


    constructor(uid: string, email: string, username: string)
    {
        this.uid = uid;
        this.email = email;
        this.username = username;
    }
}