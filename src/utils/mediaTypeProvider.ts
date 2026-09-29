type MediaType =
    | "image"
    | "video"
    | "audio"
    | "document"
    | "excel"
    | "pdf"
    | "json"
    | "code"
    | "zip";

const mediaTypeProvider = (file: File): MediaType => {
    const mimeType = file.type.toLowerCase();
    const extension = file.name.split(".").pop()?.toLowerCase();

    // Image
    if (mimeType.startsWith("image/")) {
        return "image";
    }

    // Video
    if (mimeType.startsWith("video/")) {
        return "video";
    }

    // Audio
    if (mimeType.startsWith("audio/")) {
        return "audio";
    }

    // PDF
    if (mimeType === "application/pdf" || extension === "pdf") {
        return "pdf";
    }

    // JSON
    if (
        mimeType === "application/json" ||
        extension === "json"
    ) {
        return "json";
    }

    // Excel
    const excelExtensions = ["xls", "xlsx", "xlsm", "csv"];

    if (excelExtensions.includes(extension ?? "")) {
        return "excel";
    }

    // ZIP / compressed files
    const zipExtensions = ["zip", "rar", "7z", "tar", "gz"];

    if (
        mimeType.includes("zip") ||
        zipExtensions.includes(extension ?? "")
    ) {
        return "zip";
    }

    // Code files
    const codeExtensions = [
        "js",
        "jsx",
        "ts",
        "tsx",
        "html",
        "css",
        "scss",
        "sass",
        "less",
        "json",
        "xml",
        "php",
        "py",
        "java",
        "c",
        "cpp",
        "h",
        "hpp",
        "cs",
        "go",
        "rs",
        "swift",
        "kt",
        "sql",
        "sh",
        "bash",
    ];

    if (codeExtensions.includes(extension ?? "")) {
        return "code";
    }

    // Documents
    const documentExtensions = [
        "doc",
        "docx",
        "txt",
        "rtf",
        "odt",
        "ppt",
        "pptx",
    ];

    if (documentExtensions.includes(extension ?? "")) {
        return "document";
    }

    // Default
    return "document";
};

export default mediaTypeProvider