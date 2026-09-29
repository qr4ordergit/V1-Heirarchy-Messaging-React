import { useAuthStore } from "../store/auth/auth.store"
import useContactStore from "../store/contacts/contacts.store"

const useContactNameProvider = () => {
    const { contacts } = useContactStore((state) => state)
    const { userDetails, target_user } = useAuthStore((state) => state)
    return function (user_id: string) {
        let display_name = user_id

        if (userDetails?.username === display_name || target_user === display_name) {
            return "You"
        }

        contacts.forEach(contact => {
            if (contact._id.includes(user_id)) {
                display_name = contact.display_name
                return
            }
        });

        return display_name
    }
}

export default useContactNameProvider