type JsonSchema = {
  type?: string | string[];
  format?: string;
  enum?: readonly string[];
  minLength?: number;
  minimum?: number;
  items?: JsonSchema;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  additionalProperties?: boolean;
};

type StrictObjectOptions = {
  properties: Record<string, JsonSchema>;
  required?: string[];
};

export function strictObjectSchema({ properties, required }: StrictObjectOptions) {
  return {
    type: "object",
    ...(required ? { required } : {}),
    properties,
    additionalProperties: false,
  } as const;
}

export function bodySchema(options: StrictObjectOptions) {
  return {
    body: strictObjectSchema(options),
  } as const;
}

export function paramsSchema(options: StrictObjectOptions) {
  return {
    params: strictObjectSchema(options),
  } as const;
}

export function querySchema(options: StrictObjectOptions) {
  return {
    querystring: strictObjectSchema(options),
  } as const;
}
