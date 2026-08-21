import { useAuthStore } from "../store/auth/auth.store";

export const useNextPerson = () => {
    const { userDetails, targetUserDetails } = useAuthStore((state) => state);

    const own_user_id = targetUserDetails?.user_id ?? userDetails?.username

    return function (id: string) {
        return decodeURIComponent(id)
            .split("#")
            .find((id) => id !== own_user_id);
    }

}