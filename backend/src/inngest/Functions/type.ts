

export type integration = {

    id:string ;
    userId:string ;
    historyId: string | null, 
    status: "ACTIVE" | "DISCONNECTED"

} | null