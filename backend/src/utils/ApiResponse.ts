

export class ApiResponse <T> {
    statusCode:number;
    success:boolean;
    messages:string;
    data?:T

    constructor(messages:string,statusCode:number,data?:T,success=true){
        this.statusCode=statusCode;
        this.success=success
        this.messages=messages;
        this.data=data
    }
}

export class ApiResponseLogout {
    statusCode:number;
    success:boolean;
    messages:string;


    constructor(messages:string,statusCode:number,success:boolean){
        this.statusCode=statusCode;
        this.success=success
        this.messages=messages;
    }
}