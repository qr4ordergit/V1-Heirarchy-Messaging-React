import { useConversationTypeStore } from "./conversation/conversation.type.store"

export const ClearStore = () => {
    useConversationTypeStore.getState().reset()
}