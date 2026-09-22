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

import {
  ChatOrchestrator,
  type ChatOrchestratorDependencies,
} from "./orchestrator";

import {
  supabaseChatExecutor,
} from "./supabaseExecutor";

const chatServiceDependencies:
  ChatServiceDependencies = {
  repository:
    supabaseChatRepository,
  store: memoryChatStore,
};

export const chatService =
  new ChatService(
    chatServiceDependencies,
  );

const chatOrchestratorDependencies:
  ChatOrchestratorDependencies = {
  executor:
    supabaseChatExecutor,
};

export const chatOrchestrator =
  new ChatOrchestrator(
    chatOrchestratorDependencies,
  );
