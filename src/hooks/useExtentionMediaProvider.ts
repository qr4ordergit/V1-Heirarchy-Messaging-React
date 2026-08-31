export const useExtentionMediaProvider = () => {

    type MediaType = "image" | "video" | "audio" | "document" | "excel" | "pdf" | "json" | "code";

    const EXTENSION_MEDIA_PROVIDER: Record<string, MediaType> = {
        png: "image",
        jpg: "image",
        jpeg: "image",
        gif: "image",
        webp: "image",

        mp4: "video",
        webm: "video",
        mov: "video",
        mkv: "video",

        mp3: "audio",
        wav: "audio",
        ogg: "audio",

        pdf: "pdf",
        doc: "document",
        docx: "document",
        xls: "excel",
        xlsx: "excel",
        json: "json",
        html: "code",
        css: "code",
        js: "code",
    };

    return (url: string): MediaType | undefined => {
        try {
            const extension = url
                .split("?")[0]
                .split("#")[0]
                .split(".")
                .pop()
                ?.toLowerCase();

            return extension ? EXTENSION_MEDIA_PROVIDER[extension] : undefined;
        } catch (error) {

        }
    }
}