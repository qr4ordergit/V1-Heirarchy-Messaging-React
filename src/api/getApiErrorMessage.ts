import axios from "axios";

export const getApiErrorMessage = (
    error: unknown,
    fallback = "Something went wrong"
): string | null => {

    // Ignore aborted API requests
    if (
        axios.isCancel(error) ||
        (axios.isAxiosError(error) && error.code === "ERR_CANCELED")
    ) {
        return null;
    }

    if (axios.isAxiosError(error)) {
        return (
            error.response?.data?.message ||
            error.message ||
            fallback
        );
    }

    if (error instanceof Error) {
        return error.message;
    }

    return fallback;
};