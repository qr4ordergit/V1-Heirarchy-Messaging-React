
export class E2EHelper {
    private static readonly ALGORITHM = "AES-GCM";

    private static base64ToBytes(
        base64: string,
    ): Uint8Array<ArrayBuffer> {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);

        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }

        return bytes;
    }

    private static arrayBufferToBase64(
        buffer: ArrayBuffer | Uint8Array,
    ): string {
        const bytes =
            buffer instanceof Uint8Array
                ? buffer
                : new Uint8Array(buffer);

        let binary = "";
        const chunkSize = 0x8000;

        for (let i = 0; i < bytes.length; i += chunkSize) {
            const chunk = bytes.subarray(i, i + chunkSize);
            binary += String.fromCharCode(...chunk);
        }

        return btoa(binary);
    }

    private static async importAESKey(
        base64Key: string,
    ): Promise<CryptoKey> {
        const keyBytes = this.base64ToBytes(base64Key);

        if (keyBytes.length !== 16 && keyBytes.length !== 32) {
            throw new Error(
                `Invalid AES key length: ${keyBytes.length} bytes. Expected 16 or 32 bytes.`,
            );
        }

        return crypto.subtle.importKey(
            "raw",
            keyBytes,
            {
                name: this.ALGORITHM,
            },
            false,
            ["encrypt", "decrypt"],
        );
    }

    static async encryptFile(
        key: string,
        file: File,
    ): Promise<{
        fileName: string;
        mimeType: string;
        size: number;
        cipherText: string;
        iv: string;
    } | null> {
        try {
            if (!key) {
                throw new Error("Encryption key is required");
            }

            const iv = crypto.getRandomValues(
                new Uint8Array(12),
            );

            const rawKey = await this.importAESKey(key);

            const fileBuffer = await file.arrayBuffer();

            const encryptedBuffer = await crypto.subtle.encrypt(
                {
                    name: this.ALGORITHM,
                    iv,
                },
                rawKey,
                fileBuffer,
            );

            return {
                fileName: file.name,
                mimeType: file.type,
                size: file.size,
                cipherText:
                    this.arrayBufferToBase64(encryptedBuffer),
                iv: this.arrayBufferToBase64(iv),
            };
        } catch (error) {
            console.error(
                "File encryption failed:",
                error,
            );

            return null;
        }
    }

    static async decryptFile(
        key: string,
        cipherText: string,
        ivBase64: string,
        fileName: string,
        fileType: string,
    ): Promise<File> {
        if (!key) {
            throw new Error("Decryption key is required");
        }
        const iv = this.base64ToBytes(ivBase64);

        const encryptedBuffer =
            this.base64ToBytes(cipherText);

        const rawKey = await this.importAESKey(key);

        const decryptedBuffer = await crypto.subtle.decrypt(
            {
                name: this.ALGORITHM,
                iv,
            },
            rawKey,
            encryptedBuffer,
        );

        return new File(
            [decryptedBuffer],
            fileName,
            {
                type: fileType,
            },
        );
    }
}
