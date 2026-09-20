import type {
  ChatApiRequest,
  ChatAttachment,
} from "../../types";

import {
  isArray,
  isNonEmptyString,
  isObject,
  isString,
  validateNonEmptyString,
  type ValidationResult,
} from "../../lib/validation";

const MAX_MESSAGE_LENGTH = 32_000;
const MAX_ATTACHMENTS = 10;
const MAX_ATTACHMENT_NAME_LENGTH = 255;
const MAX_MIME_TYPE_LENGTH = 255;
const MAX_ATTACHMENT_SIZE = 50 * 1024 * 1024;

function validateAttachment(
  value: unknown,
  index: number,
): ValidationResult<ChatAttachment> {
  const field = `attachments[${index}]`;

  if (!isObject(value)) {
    return {
      success: false,
      error: {
        code: "INVALID_INPUT",
        field,
        message: `${field} must be an object.`,
      },
    };
  }

  const id = validateNonEmptyString(
    value.id,
    `${field}.id`,
  );

  if (!id.success) {
    return id;
  }

  const name = validateNonEmptyString(
    value.name,
    `${field}.name`,
  );

  if (!name.success) {
    return name;
  }

  if (name.data.length > MAX_ATTACHMENT_NAME_LENGTH) {
    return {
      success: false,
      error: {
        code: "INVALID_INPUT",
        field: `${field}.name`,
        message: `${field}.name exceeds the maximum allowed length.`,
      },
    };
  }

  const mimeType = validateNonEmptyString(
    value.mimeType,
    `${field}.mimeType`,
  );

  if (!mimeType.success) {
    return mimeType;
  }

  if (mimeType.data.length > MAX_MIME_TYPE_LENGTH) {
    return {
      success: false,
      error: {
        code: "INVALID_INPUT",
        field: `${field}.mimeType`,
        message: `${field}.mimeType exceeds the maximum allowed length.`,
      },
    };
  }

  if (
    !isString(value.type) ||
    ![
      "image",
      "video",
      "audio",
      "document",
      "other",
    ].includes(value.type)
  ) {
    return {
      success: false,
      error: {
        code: "INVALID_INPUT",
        field: `${field}.type`,
        message: `${field}.type is invalid.`,
      },
    };
  }

  if (
    typeof value.size !== "number" ||
    !Number.isSafeInteger(value.size) ||
    value.size < 0 ||
    value.size > MAX_ATTACHMENT_SIZE
  ) {
    return {
      success: false,
      error: {
        code: "INVALID_INPUT",
        field: `${field}.size`,
        message: `${field}.size must be a valid size within the allowed limit.`,
      },
    };
  }

  if (
    value.url !== undefined &&
    !isString(value.url)
  ) {
    return {
      success: false,
      error: {
        code: "INVALID_INPUT",
        field: `${field}.url`,
        message: `${field}.url must be a string when provided.`,
      },
    };
  }

  if (
    value.thumbnailUrl !== undefined &&
    !isString(value.thumbnailUrl)
  ) {
    return {
      success: false,
      error: {
        code: "INVALID_INPUT",
        field: `${field}.thumbnailUrl`,
        message: `${field}.thumbnailUrl must be a string when provided.`,
      },
    };
  }

  return {
    success: true,
    data: {
      id: id.data,
      type: value.type,
      name: name.data,
      mimeType: mimeType.data,
      size: value.size,
      ...(value.url !== undefined
        ? { url: value.url }
        : {}),
      ...(value.thumbnailUrl !== undefined
        ? { thumbnailUrl: value.thumbnailUrl }
        : {}),
    },
  };
}

export function validateChatApiRequest(
  value: unknown,
): ValidationResult<ChatApiRequest> {
  if (!isObject(value)) {
    return {
      success: false,
      error: {
        code: "INVALID_INPUT",
        field: "request",
        message: "Chat request must be an object.",
      },
    };
  }

  const message = validateNonEmptyString(
    value.message,
    "message",
  );

  if (!message.success) {
    return message;
  }

  if (message.data.length > MAX_MESSAGE_LENGTH) {
    return {
      success: false,
      error: {
        code: "INVALID_INPUT",
        field: "message",
        message: `Message exceeds the maximum allowed length of ${MAX_MESSAGE_LENGTH} characters.`,
      },
    };
  }

  if (
    value.conversationId !== undefined &&
    !isNonEmptyString(value.conversationId)
  ) {
    return {
      success: false,
      error: {
        code: "INVALID_INPUT",
        field: "conversationId",
        message:
          "conversationId must be a non-empty string when provided.",
      },
    };
  }

  if (
    value.capabilityId !== undefined &&
    !isNonEmptyString(value.capabilityId)
  ) {
    return {
      success: false,
      error: {
        code: "INVALID_INPUT",
        field: "capabilityId",
        message:
          "capabilityId must be a non-empty string when provided.",
      },
    };
  }

  if (
    value.locale !== undefined &&
    !isNonEmptyString(value.locale)
  ) {
    return {
      success: false,
      error: {
        code: "INVALID_INPUT",
        field: "locale",
        message:
          "locale must be a non-empty string when provided.",
      },
    };
  }

  if (
    value.requestId !== undefined &&
    !isNonEmptyString(value.requestId)
  ) {
    return {
      success: false,
      error: {
        code: "INVALID_INPUT",
        field: "requestId",
        message:
          "requestId must be a non-empty string when provided.",
      },
    };
  }

  let attachments: readonly ChatAttachment[] | undefined;

  if (value.attachments !== undefined) {
    if (!isArray(value.attachments)) {
      return {
        success: false,
        error: {
          code: "INVALID_INPUT",
          field: "attachments",
          message:
            "attachments must be an array when provided.",
        },
      };
    }

    if (value.attachments.length > MAX_ATTACHMENTS) {
      return {
        success: false,
        error: {
          code: "INVALID_INPUT",
          field: "attachments",
          message: `A maximum of ${MAX_ATTACHMENTS} attachments is allowed.`,
        },
      };
    }

    const validatedAttachments: ChatAttachment[] = [];

    for (
      let index = 0;
      index < value.attachments.length;
      index += 1
    ) {
      const result = validateAttachment(
        value.attachments[index],
        index,
      );

      if (!result.success) {
        return result;
      }

      validatedAttachments.push(result.data);
    }

    attachments = validatedAttachments;
  }

  return {
    success: true,
    data: {
      message: message.data,
      ...(value.conversationId !== undefined
        ? {
            conversationId:
              value.conversationId.trim(),
          }
        : {}),
      ...(attachments !== undefined
        ? { attachments }
        : {}),
      ...(value.capabilityId !== undefined
        ? {
            capabilityId:
              value.capabilityId.trim(),
          }
        : {}),
      ...(value.locale !== undefined
        ? {
            locale: value.locale.trim(),
          }
        : {}),
      ...(value.requestId !== undefined
        ? {
            requestId: value.requestId.trim(),
          }
        : {}),
    },
  };
}
