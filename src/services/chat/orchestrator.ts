import type {
  ChatApiRequest,
  RoutingInput,
} from "../../types";

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
}

export interface ChatOrchestratorInput {
  readonly userId: string;
  readonly requestId: string;
  readonly request: ChatApiRequest;
}

export class ChatOrchestrator {
  private readonly executor: ChatExecutor;

  public constructor(
    dependencies: ChatOrchestratorDependencies,
  ) {
    this.executor =
      dependencies.executor;
  }

  public async execute(
    input: ChatOrchestratorInput,
  ): Promise<ChatExecutionResult> {
    const routingInput: RoutingInput = {
      message: input.request.message,
      ...(input.request.conversationId
        ? {
            conversationId:
              input.request.conversationId,
          }
        : {}),
      ...(input.request.locale
        ? {
            locale:
              input.request.locale,
          }
        : {}),
      hasAttachments:
        (input.request.attachments?.length ??
          0) > 0,
      ...(input.request.attachments &&
      input.request.attachments.length > 0
        ? {
            attachmentTypes:
              input.request.attachments.map(
                (attachment) =>
                  attachment.mimeType,
              ),
          }
        : {}),
    };

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

    const executionInput:
      ChatExecutionInput = {
        context: executionContext,
        request: {
          ...input.request,
          capabilityId:
            input.request.capabilityId ??
            routingContext.result.primary
              .capability,
          requestId:
            input.requestId,
        },
      };

    return this.executor.execute(
      executionInput,
    );
  }
}
