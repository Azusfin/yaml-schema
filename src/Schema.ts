export interface SchemaAny {
    type: "any"
    default?: unknown
}

export interface SchemaBoolean {
    type: "boolean"
    default?: unknown
}

export interface SchemaNumber {
    type: "number"
    default?: unknown
    limit?: {
        min?: number
        max?: number
    }
}

export interface SchemaString {
    type: "string"
    default?: unknown
    length?: {
        min?: number
        max?: number
    }
}

export interface SchemaChoices {
    type: "choices"
    choices: (string | number)[]
    default?: unknown
}

export interface SchemaArray {
    type: "array"
    element: SchemaOrSchemas
    default?: unknown
    length?: {
        min?: number
        max?: number
    }
}

export interface BaseSchemaObject {
    type: "object"
    default?: unknown
}

export interface SchemaObjectProps extends BaseSchemaObject {
    props: Record<string, SchemaOrSchemas>
    any?: never
}

export interface SchemaObjectAny extends BaseSchemaObject {
    props?: never
    any: {
        interface: SchemaOrSchemas
        length?: {
            min?: number
            max?: number
        }
    }
}

export type SchemaObject = SchemaObjectProps | SchemaObjectAny

export type Schema =
    | SchemaAny
    | SchemaBoolean
    | SchemaNumber
    | SchemaString
    | SchemaChoices
    | SchemaArray
    | SchemaObject

export type SchemaOrSchemas = Schema | Schema[]
