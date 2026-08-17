import { useConversationTypeStore } from "./conversation/conversation.type.store";
import { useAccountsStore } from "./accounts/accounts.store";

export const ClearStore = () => {
  useConversationTypeStore.getState().reset();
  useAccountsStore.getState().reset();
};
