


export class ApiError extends Error {

    statusCode:number;
     public errors?: Record<string, string[]>;

    constructor(message:string,statusCode:number ){
        super(message);
        this.statusCode= statusCode
       
    }

}