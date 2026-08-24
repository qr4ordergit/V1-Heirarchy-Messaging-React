import useContactStore from "../store/contacts/contacts.store"

const useContactNameProvider = () => {
    const { contacts } = useContactStore((state) => state)
    return function (user_id: string) {
        let display_name = user_id

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