import { z } from "zod";


export const integrationIdParams = z.object({
    id: z.string().uuid(),
});

export type IntegrationIdParams = z.infer<typeof integrationIdParams>;
