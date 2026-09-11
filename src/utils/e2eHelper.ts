export interface DecryptMediaOptions {
    fileName: string;
    fileType: string;
}

export class E2EHelper {
    /**
     * Plaintext encryption chunk size.
     *
     * 1 MiB = 1024 * 1024 bytes
     */
    private static readonly CHUNK_SIZE = 1024 * 1024;

    /**
     * AES-GCM IV size.
     */
    private static readonly IV_LENGTH = 12;

    /**
     * AES-GCM authentication tag.
     *
     * Web Crypto AES-GCM produces a 16-byte tag
     * when tagLength = 128.
     */
    private static readonly TAG_LENGTH = 16;

    /**
     * We store plaintext size in the first 4 bytes
     * of every encrypted chunk.
     */
    private static readonly SIZE_HEADER_LENGTH = 4;

    /**
     * Get 1 MiB encryption chunk size.
     */
    public static getChunkSize(): number {
        return this.CHUNK_SIZE;
    }

    /**
     * Convert Uint8Array to a real ArrayBuffer.
     *
     * This also prevents TypeScript issues involving
     * ArrayBufferLike / SharedArrayBuffer.
     */
    private static toArrayBuffer(data: Uint8Array): ArrayBuffer {
        return data.buffer.slice(
            data.byteOffset,
            data.byteOffset + data.byteLength,
        ) as ArrayBuffer;
    }

    /**
     * Convert Base64 string to ArrayBuffer.
     *
     * Example backend key:
     *
     * 14hk23lN+M1U7iXK+8HhJY77uj3sJHteL8CA/WXc98g=
     *
     * This represents 32 bytes -> AES-256.
     */
    private static base64ToArrayBuffer(base64: string): ArrayBuffer {
        try {
            const binary = atob(base64);

            const bytes = new Uint8Array(binary.length);

            for (let i = 0; i < binary.length; i++) {
                bytes[i] = binary.charCodeAt(i);
            }

            return this.toArrayBuffer(bytes);
        } catch {
            throw new Error("Invalid Base64 encryption key");
        }
    }

    /**
     * Import Base64 AES key.
     *
     * Supports:
     *
     * 16 bytes = AES-128
     * 32 bytes = AES-256
     */
    private static async importAESKey(base64Key: string): Promise<CryptoKey> {
        if (!base64Key) {
            throw new Error("Encryption key is required");
        }

        const rawKey = this.base64ToArrayBuffer(base64Key);

        if (rawKey.byteLength !== 16 && rawKey.byteLength !== 32) {
            throw new Error(
                `Invalid AES key length: ${rawKey.byteLength} bytes. Expected 16 or 32 bytes.`,
            );
        }

        return crypto.subtle.importKey(
            "raw",
            rawKey,
            {
                name: "AES-GCM",
            },
            false,
            ["encrypt", "decrypt"],
        );
    }

    /**
     * Convert chunk number into AAD.
     *
     * Chunk 1:
     * [00 00 00 01]
     *
     * Chunk 2:
     * [00 00 00 02]
     *
     * This prevents encrypted chunks from being silently
     * reordered.
     */
    private static chunkNumberToAAD(chunkNumber: number): ArrayBuffer {
        if (!Number.isInteger(chunkNumber) || chunkNumber < 1) {
            throw new Error("Invalid chunk number");
        }

        const buffer = new ArrayBuffer(4);

        const view = new DataView(buffer);

        view.setUint32(0, chunkNumber, false);

        return buffer;
    }

    /**
     * Encrypt one 1 MiB plaintext chunk.
     *
     * Encryption format:
     *
     * ┌──────────────────────────────┐
     * │ 4 bytes plaintext size       │
     * ├──────────────────────────────┤
     * │ 12 bytes IV                  │
     * ├──────────────────────────────┤
     * │ ciphertext + 16 byte tag     │
     * └──────────────────────────────┘
     *
     * The last chunk can be smaller than 1 MiB.
     */
    public static async encryptPart(
        file: File,
        start: number,
        end: number,
        chunkNumber: number,
        secret: string,
    ): Promise<ArrayBuffer> {
        if (!file) {
            throw new Error("File is required");
        }

        if (start < 0 || end <= start || start >= file.size) {
            throw new Error("Invalid chunk range");
        }

        const actualEnd = Math.min(end, file.size);

        /**
         * Read only this chunk.
         *
         * We never load the entire file.
         */
        const plaintextBuffer = await file.slice(start, actualEnd).arrayBuffer();

        const plaintext = new Uint8Array(plaintextBuffer);

        if (plaintext.byteLength === 0) {
            throw new Error("Cannot encrypt empty chunk");
        }

        /**
         * Import AES key.
         */
        const key = await this.importAESKey(secret);

        /**
         * Generate unique IV for this chunk.
         */
        const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));

        /**
         * Chunk number is authenticated
         * but not encrypted.
         */
        const aad = this.chunkNumberToAAD(chunkNumber);

        /**
         * AES-GCM encryption.
         *
         * Output size:
         *
         * plaintext size + 16 byte auth tag
         */
        const ciphertext = await crypto.subtle.encrypt(
            {
                name: "AES-GCM",

                iv: this.toArrayBuffer(iv),

                additionalData: aad,

                tagLength: 128,
            },

            key,

            plaintextBuffer,
        );

        /**
         * Header:
         *
         * 4 bytes = plaintext size
         * 12 bytes = IV
         */
        const header = new Uint8Array(this.SIZE_HEADER_LENGTH + this.IV_LENGTH);

        const headerView = new DataView(header.buffer);

        headerView.setUint32(0, plaintext.byteLength, false);

        header.set(iv, this.SIZE_HEADER_LENGTH);

        /**
         * Final encrypted chunk:
         *
         * [4 bytes size]
         * [12 bytes IV]
         * [ciphertext + tag]
         */
        const result = new Uint8Array(header.byteLength + ciphertext.byteLength);

        result.set(header, 0);

        result.set(new Uint8Array(ciphertext), header.byteLength);

        return this.toArrayBuffer(result);
    }

    /**
     * Decrypt one encrypted chunk.
     */
    private static async decryptChunk(
        ciphertext: ArrayBuffer,
        iv: Uint8Array,
        chunkNumber: number,
        key: CryptoKey,
    ): Promise<ArrayBuffer> {
        const aad = this.chunkNumberToAAD(chunkNumber);

        try {
            return await crypto.subtle.decrypt(
                {
                    name: "AES-GCM",

                    iv: this.toArrayBuffer(iv),

                    additionalData: aad,

                    tagLength: 128,
                },

                key,

                ciphertext,
            );
        } catch {
            throw new Error(
                `Failed to decrypt chunk ${chunkNumber}. The data may be corrupted or the encryption key may be incorrect.`,
            );
        }
    }

    /**
     * Creates a reader that can read exactly N bytes
     * from a ReadableStream.
     *
     * Network chunks are NOT guaranteed to match our
     * encryption chunks.
     *
     * Example:
     *
     * Network may give:
     *
     * 64 KB
     * 128 KB
     * 32 KB
     *
     * while our encryption frame may be ~1 MB.
     *
     * This method combines network data internally until
     * the requested number of bytes is available.
     */
    private static createExactReader(stream: ReadableStream<Uint8Array>) {
        const reader = stream.getReader();

        let pending = new Uint8Array(0);

        const readExactly = async (
            requiredLength: number,
        ): Promise<Uint8Array | null> => {
            if (requiredLength <= 0) {
                return new Uint8Array(0);
            }

            while (pending.length < requiredLength) {
                const { value, done } = await reader.read();

                if (done) {
                    /**
                     * Normal EOF.
                     */
                    if (pending.length === 0) {
                        return null;
                    }

                    /**
                     * Stream ended in the middle
                     * of an encrypted frame.
                     */
                    throw new Error("Unexpected end of encrypted media stream");
                }

                if (!value || value.length === 0) {
                    continue;
                }

                const combined = new Uint8Array(pending.length + value.length);

                combined.set(pending, 0);

                combined.set(value, pending.length);

                pending = combined;
            }

            const result = pending.slice(0, requiredLength);

            pending = pending.slice(requiredLength);

            return result;
        };

        return {
            reader,
            readExactly,
        };
    }

    /**
     * Decrypt encrypted S3 media stream.
     *
     * IMPORTANT:
     *
     * This does NOT use:
     *
     * response.json()
     *
     * or:
     *
     * response.arrayBuffer()
     *
     * The encrypted S3 object is processed
     * incrementally.
     */
    public static async decryptMediaStream(
        stream: ReadableStream<Uint8Array>,
        secret: string,
        fileName: string,
        fileType: string,
    ): Promise<File> {
        if (!stream) {
            throw new Error("Encrypted media stream is required");
        }

        if (!secret) {
            throw new Error("Encryption key is required");
        }

        const key = await this.importAESKey(secret);

        const { reader, readExactly } = this.createExactReader(stream);

        /**
         * We eventually need a File for your
         * current MediaChat implementation.
         */
        const decryptedChunks: BlobPart[] = [];

        let chunkNumber = 1;

        try {
            while (true) {
                /**
                 * --------------------------------
                 * 1. Read plaintext size
                 * --------------------------------
                 */
                const sizeBytes = await readExactly(this.SIZE_HEADER_LENGTH);

                /**
                 * Clean end of stream.
                 */
                if (!sizeBytes) {
                    break;
                }

                const sizeView = new DataView(this.toArrayBuffer(sizeBytes));

                const plaintextSize = sizeView.getUint32(0, false);

                /**
                 * Validate plaintext size.
                 *
                 * Normal chunk:
                 * 1 MiB
                 *
                 * Last chunk:
                 * <= 1 MiB
                 */
                if (plaintextSize <= 0 || plaintextSize > this.CHUNK_SIZE) {
                    throw new Error(`Invalid plaintext chunk size: ${plaintextSize}`);
                }

                /**
                 * --------------------------------
                 * 2. Read IV
                 * --------------------------------
                 */
                const iv = await readExactly(this.IV_LENGTH);

                if (!iv) {
                    throw new Error(`Missing IV for chunk ${chunkNumber}`);
                }

                /**
                 * --------------------------------
                 * 3. Read ciphertext
                 * --------------------------------
                 *
                 * AES-GCM:
                 *
                 * ciphertext =
                 * plaintext + 16 byte tag
                 */
                const encryptedSize = plaintextSize + this.TAG_LENGTH;

                const ciphertext = await readExactly(encryptedSize);

                if (!ciphertext) {
                    throw new Error(`Missing ciphertext for chunk ${chunkNumber}`);
                }

                /**
                 * --------------------------------
                 * 4. Decrypt
                 * --------------------------------
                 */
                const decrypted = await this.decryptChunk(
                    this.toArrayBuffer(ciphertext),
                    iv,
                    chunkNumber,
                    key,
                );

                /**
                 * Verify decrypted size.
                 */
                if (decrypted.byteLength !== plaintextSize) {
                    throw new Error(`Decrypted chunk ${chunkNumber} has invalid size`);
                }

                /**
                 * Keep the decrypted chunk.
                 *
                 * The complete File is constructed
                 * at the end because MediaChat currently
                 * expects File.
                 */
                decryptedChunks.push(decrypted);

                chunkNumber++;
            }
        } finally {
            reader.releaseLock();
        }

        if (decryptedChunks.length === 0) {
            throw new Error("Encrypted media contains no data");
        }

        /**
         * Construct the final File.
         */
        return new File(decryptedChunks, fileName, {
            type: fileType || "application/octet-stream",
        });
    }

    /**
     * Download encrypted media and decrypt it.
     *
     * This uses fetch() so that we can access
     * response.body as a ReadableStream.
     */
    public static async decryptMediaFromUrl(
        url: string,
        secret: string,
        fileName: string,
        fileType: string,
    ): Promise<File> {
        if (!url) {
            throw new Error("Media URL is required");
        }

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(
                `Media download failed: ${response.status} ${response.statusText}`,
            );
        }

        if (!response.body) {
            throw new Error("ReadableStream is not available");
        }

        return this.decryptMediaStream(response.body, secret, fileName, fileType);
    }

    /**
     * Calculate number of 1 MiB encryption chunks.
     */
    public static getChunkCount(fileSize: number): number {
        if (fileSize <= 0) {
            return 0;
        }

        return Math.ceil(fileSize / this.CHUNK_SIZE);
    }

    /**
     * Get start/end for a specific encryption chunk.
     */
    public static getChunkRange(
        chunkNumber: number,
        fileSize: number,
    ): {
        start: number;
        end: number;
    } {
        if (chunkNumber < 1 || !Number.isInteger(chunkNumber)) {
            throw new Error("Invalid chunk number");
        }

        const start = (chunkNumber - 1) * this.CHUNK_SIZE;

        if (start >= fileSize) {
            throw new Error("Chunk number exceeds file size");
        }

        const end = Math.min(start + this.CHUNK_SIZE, fileSize);

        return {
            start,
            end,
        };
    }
}
