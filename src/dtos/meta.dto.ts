export interface WhatsAppRequestDto {
    messaging_product: string;
    to: string;
    type: "text" | "template";
    template?: {
        name: string;
        language: {
            code: string;
        };
    };
    text?: {
        body: string;
    };
}
export interface WhatsAppResponseDto {
    messaging_product: string;
    contacts: Array<{
        input: string;
        wa_id: string;
    }>;
    messages: Array<{
        id: string;
    }>;
}
