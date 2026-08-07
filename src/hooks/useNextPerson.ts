import { useAuthStore } from "../store/auth/auth.store";

export const useNextPerson = () => {
    const userDetails = useAuthStore((state) => state.userDetails);

    return function (id: string) {
        return decodeURIComponent(id)
            .split("#")
            .find((id) => id !== userDetails?.username);
    }

}