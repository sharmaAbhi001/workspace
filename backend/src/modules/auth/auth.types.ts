import bcrypt from "bcrypt"


export class AuthUser {
    id!:string;
    name!:string;
    email!:string;
    password!: string | null;
    createdAt!: Date;
    updatedAt!: Date;
    emailVerified!: boolean;


    constructor(data:Partial<AuthUser>){
        Object.assign(this,data)
    }

     async hashPassword(): Promise<void> {
       if(this.password){
        this.password = await bcrypt.hash(this.password, 10);
       }
    }

    async comparePassword(password:string):Promise<boolean>{
    if(this.password){
        const isMatch:boolean =  await bcrypt.compare(password,this.password);
        return isMatch
    }else{
        return false;
    }
    
    }

}
