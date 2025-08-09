export interface TwilioRequestDto {
    from: string;
    to:string;
    body: string;
    media: Array<{ url: string }> | undefined;
}
export interface TwilioResponseDto {
    sid: string;
    status: string;
}
