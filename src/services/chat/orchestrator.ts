import type {
  ChatApiRequest,
  ChatApiResponse,
  ChatMessage,
  RoutingInput,
} from "../../types";

import {
  ChatService,
  type ChatServiceResponse,
} from "./service";

import {
  routeCapability,
} from "./router";

import type {
  ChatExecutionContext,
  ChatExecutionInput,
  ChatExecutionResult,
  ChatExecutor,
} from "./execution";

export interface ChatOrchestratorDependencies {
  readonly executor: ChatExecutor;
  readonly chatService: ChatService;
}

export interface ChatOrchestratorInput {
  readonly userId: string;
  readonly requestId: string;
  readonly request: ChatApiRequest;
}

function createExecutionFailure(
  result: ChatServiceResponse,
): ChatExecutionResult {
  if (result.success) {
    throw new Error(
      "Expected a ChatService validation failure.",
    );
  }

  return {
    success: false,
    error: {
      code: "INVALID_INPUT",
      message: result.error.message,
      retryable: false,
    },
  };
}

function createRoutingInput(
  request: ChatApiRequest,
): RoutingInput {
  return {
    message: request.message,
    ...(request.conversationId
      ? {
          conversationId:
            request.conversationId,
        }
      : {}),
    ...(request.locale
      ? {
          locale: request.locale,
        }
      : {}),
    hasAttachments:
      (request.attachments?.length ?? 0) > 0,
    ...(request.attachments &&
    request.attachments.length > 0
      ? {
          attachmentTypes:
            request.attachments.map(
              (attachment) =>
                attachment.mimeType,
            ),
        }
      : {}),
  };
}

function createPreparedRequest(
  request: ChatApiRequest,
  response: ChatApiResponse,
  capabilityId: string,
  requestId: string,
): ChatApiRequest {
  return {
    ...request,
    conversationId:
      response.conversationId,
    capabilityId,
    requestId,
  };
}

function isUserMessage(
  message: ChatMessage,
): boolean {
  return message.role === "user";
}

export class ChatOrchestrator {
  private readonly executor: ChatExecutor;

  private readonly chatService: ChatService;

  public constructor(
    dependencies: ChatOrchestratorDependencies,
  ) {
    this.executor =
      dependencies.executor;

    this.chatService =
      dependencies.chatService;
  }

  public async execute(
    input: ChatOrchestratorInput,
  ): Promise<ChatExecutionResult> {
    const prepared =
      await this.chatService.prepareMessage(
        input.userId,
        input.request,
      );

    if (!prepared.success) {
      return createExecutionFailure(
        prepared,
      );
    }

    if (
      !isUserMessage(
        prepared.response.message,
      )
    ) {
      return {
        success: false,
        error: {
          code: "INVALID_INPUT",
          message:
            "The prepared chat message has an invalid role.",
          retryable: false,
        },
      };
    }

    const routingInput =
      createRoutingInput({
        ...input.request,
        conversationId:
          prepared.response.conversationId,
      });

    const routingContext =
      routeCapability(
        routingInput,
        input.requestId,
      );

    const executionContext:
      ChatExecutionContext = {
        userId: input.userId,
        requestId: input.requestId,
      };

    const executionRequest =
      createPreparedRequest(
        input.request,
        prepared.response,
        routingContext.result.primary
          .capability,
        input.requestId,
      );

    const executionInput:
      ChatExecutionInput = {
        context: executionContext,
        request: executionRequest,
      };

    return this.executor.execute(
      executionInput,
    );
  }
}
