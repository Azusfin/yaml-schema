import { Scalar, YAMLMap, YAMLSeq, isScalar, isSeq, isMap } from "yaml"
import { Schema, SchemaAny } from "./Schema"

export type YAMLItem =
    | YAMLMap<Scalar<string>>
    | YAMLSeq
    | Scalar<boolean | number | string>
    | null

export type YAMLType =
    | "unknown"
    | "boolean"
    | "number"
    | "string"
    | "array"
    | "object"

export function yamlTypeof(item: YAMLItem): YAMLType {
    if (isMap(item)) return "object"
    if (isSeq(item)) return "array"
    if (isScalar(item)) {
        switch (typeof item.value) {
            case "boolean":
                return "boolean"
            case "number":
                return "number"
            case "string":
                return "string"
            default:
                return "unknown"
        }
    }

    return "unknown"
}

export function yamlSchemaFromAny(item: Exclude<YAMLItem, null>): Exclude<Schema, SchemaAny> {
    if (isMap(item)) {
        return {
            type: "object",
            any: {
                interface: {
                    type: "any"
                }
            }
        }
    }

    if (isSeq(item)) {
        return {
            type: "array",
            element: {
                type: "any"
            }
        }
    }

    if (isScalar(item)) {
        switch (typeof item.value) {
            case "boolean":
                return {
                    type: "boolean"
                }
            case "number":
                return {
                    type: "number"
                }
            default:
                return {
                    type: "string"
                }
        }
    }

    return {
        type: "string"
    }
}
