import {
  ChatService,
  type ChatServiceDependencies,
} from "./service";

import {
  supabaseChatRepository,
} from "./supabaseRepository";

import {
  memoryChatStore,
} from "./memoryStore";

const chatServiceDependencies: ChatServiceDependencies =
  {
    repository:
      supabaseChatRepository,
    store: memoryChatStore,
  };

export const chatService =
  new ChatService(
    chatServiceDependencies,
  );
