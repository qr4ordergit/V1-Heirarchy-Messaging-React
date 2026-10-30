import { useAuthStore } from "../store/auth/auth.store";

export const useNextPerson = () => {
    const { userDetails, target_user } = useAuthStore((state) => state);

    const own_user_id = target_user ? target_user : userDetails?.username

    return function (id: string) {
        return decodeURIComponent(id)
            .split("#")
            .find((id) => id !== own_user_id);
    }

}