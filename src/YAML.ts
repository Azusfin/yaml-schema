import { Document, parseDocument, isDocument, isScalar, YAMLSeq, YAMLMap, isSeq, Scalar } from "yaml"
import { YAMLItem, yamlTypeof, yamlSchemaFromAny } from "./Util"
import { Schema, SchemaArray, SchemaOrSchemas } from "./Schema"
import { YAMLSchemaError, ErrorCodes } from "./Error"

export class YAML<T = unknown> {
    public schema: SchemaOrSchemas

    public constructor(schema: SchemaOrSchemas) {
        this.schema = schema
    }

    public parse(yamlString: string): T {
        const document = parseDocument(yamlString)
        return this.transform(document)
    }

    public transform(yaml: Document | YAMLItem, transformSchema?: SchemaOrSchemas): T
    public transform(yaml: Document | YAMLItem, transformSchema = this.schema): unknown {
        let schema = transformSchema

        if (!Array.isArray(schema)) {
            schema = [schema]
        }

        if (isDocument(yaml)) {
            return this.transform(yaml.contents as YAMLItem)
        }

        if (yaml === null || (isScalar(yaml) && yaml.value === null)) {
            let defaultValue: unknown
            let hasDefault = false

            for (const schem of schema) {
                if ("default" in schem) {
                    defaultValue = schem.default
                    hasDefault = true

                    break
                }
            }

            if (hasDefault) return defaultValue

            throw new YAMLSchemaError(ErrorCodes.Required, "Value is required", [])
        }

        const valueType = yamlTypeof(yaml)
        const schemas: Schema[] = []
        const errors: string[] = []

        for (const currentSchema of schema) {
            const schem = currentSchema.type === "any"
                ? yamlSchemaFromAny(yaml)
                : currentSchema

            if (schem.type === "choices") {
                if (
                    valueType === "number" ||
                    valueType === "string"
                ) {
                    schemas.push(schem)
                    continue
                } else {
                    errors.push(`Value must be typeof number or string, received ${valueType}`)
                }
            }

            if (valueType !== "unknown" && schem.type === valueType) {
                schemas.push(schem)
                continue
            }

            errors.push(`Value must be typeof ${schem.type}, received ${valueType}`)
        }

        if (!schemas.length) {
            throw new YAMLSchemaError(ErrorCodes.InvalidType, `${errors.join("\n          ")}`, [])
        }

        if (isScalar(yaml)) {
            if (typeof yaml.value === "boolean") return yaml.value

            if (schemas.some(schem => schem.type === "choices")) {
                try {
                    return this.transformChoices(yaml.value, schemas)
                } catch (err) {
                    if (
                        !(err instanceof YAMLSchemaError) ||
                        !schemas.some(schem => schem.type === valueType)
                    ) {
                        throw err
                    }
                }
            }

            if (typeof yaml.value === "number") return this.transformNumber(yaml.value, schemas)
            if (typeof yaml.value === "string") return this.transformString(yaml.value, schemas)
        }

        if (isSeq(yaml)) return this.transformArray(yaml, schemas)

        return this.transformObject(yaml as YAMLMap<Scalar<string>>, schemas)
    }

    private transformChoices(strOrNum: string | number, schemas: Schema[]): string | number {
        let choiceExist = false

        for (const schema of schemas) {
            if (schema.type !== "choices") continue
            if (schema.choices.some(choice => choice === strOrNum)) {
                choiceExist = true
                break
            }
        }

        if (!choiceExist) {
            throw new YAMLSchemaError(ErrorCodes.ChoiceDoesntExist, "Choice doesn't exists in the schema", [])
        }

        return strOrNum
    }

    private transformNumber(num: number, schemas: Schema[]): number {
        let limitSafe = false
        const errors: string[] = []

        for (const schema of schemas) {
            if (schema.type !== "number") continue
            if (schema.limit) {
                if (typeof schema.limit.min === "number" && num < schema.limit.min) {
                    errors.push(`Number must be more than or equal to ${schema.limit.min}, received ${num}`)
                    continue
                }

                if (typeof schema.limit.max === "number" && num > schema.limit.max) {
                    errors.push(`Number must be less than or equal to ${schema.limit.max}, received ${num}`)
                    continue
                }
            }

            limitSafe = true
            break
        }

        if (!limitSafe) {
            throw new YAMLSchemaError(ErrorCodes.NumberLimitPassed, `${errors.join("\n          ")}`, [])
        }

        return num
    }

    private transformString(str: string, schemas: Schema[]): string {
        let lengthSafe = false
        const errors: string[] = []

        for (const schema of schemas) {
            if (schema.type !== "string") continue
            if (schema.length) {
                if (typeof schema.length.min === "number" && str.length < schema.length.min) {
                    errors.push(`String length must be longer than or equal to ${schema.length.min}, received ${str.length}`)
                    continue
                }

                if (typeof schema.length.max === "number" && str.length > schema.length.max) {
                    errors.push(`String length must be shorter than or equal to ${schema.length.max}, received ${str.length}`)
                    continue
                }
            }

            lengthSafe = true
            break
        }

        if (!lengthSafe) {
            throw new YAMLSchemaError(ErrorCodes.StringLengthPassed, `${errors.join("\n          ")}`, [])
        }

        return str
    }

    private transformArray(arr: YAMLSeq, schemas: Schema[]): unknown[] {
        const errors: string[] = []
        let allowedSchema!: SchemaArray

        for (const schema of schemas) {
            if (schema.type !== "array") continue
            if (schema.length) {
                if (typeof schema.length.min === "number" && arr.items.length < schema.length.min) {
                    errors.push(`Array length must be longer than or equal to ${schema.length.min}, received ${arr.items.length}`)
                    continue
                }

                if (typeof schema.length.max === "number" && arr.items.length > schema.length.max) {
                    errors.push(`Array length must be shorter than or equal to ${schema.length.max}, received ${arr.items.length}`)
                    continue
                }
            }

            allowedSchema = schema
            break
        }

        if (!allowedSchema) {
            throw new YAMLSchemaError(ErrorCodes.ArrayLengthPassed, `${errors.join("\n          ")}`, [])
        }

        const elements: unknown[] = []

        for (const [index, item] of arr.items.entries()) {
            try {
                elements.push(this.transform(item as YAMLItem, allowedSchema.element))
            } catch (err) {
                if (err instanceof YAMLSchemaError) {
                    err.paths.push(index)
                    throw new YAMLSchemaError(err.code, err.something, err.paths)
                }

                throw err
            }
        }

        return elements
    }

    private transformObject(obj: YAMLMap<Scalar<string>>, schemas: Schema[]): Record<string, unknown> {
        const lengthErrors: string[] = []
        let lastError!: YAMLSchemaError

        const object: Record<string, unknown> = {}

        schemaLoop: for (const schema of schemas) {
            if (schema.type !== "object") continue

            if (schema.props) {
                const keys = Object.keys(schema.props)

                for (const key of keys) {
                    const item = obj.get(new Scalar(key), true) as YAMLItem ?? null

                    try {
                        object[key] = this.transform(item, schema.props[key])
                    } catch (err) {
                        if (err instanceof YAMLSchemaError) {
                            err.paths.push(key)
                            lastError = new YAMLSchemaError(err.code, err.something, err.paths)

                            continue schemaLoop
                        }

                        throw err
                    }
                }

                return object
            }

            if (schema.any) {
                if (schema.any.length) {
                    if (typeof schema.any.length.min === "number" && obj.items.length < schema.any.length.min) {
                        lengthErrors.push(`Object length must be longer than or equal to ${schema.any.length.min}, received ${obj.items.length}`)
                        continue
                    }

                    if (typeof schema.any.length.max === "number" && obj.items.length > schema.any.length.max) {
                        lengthErrors.push(`Object length must be shorter than or equal to ${schema.any.length.max}, received ${obj.items.length}`)
                        continue
                    }
                }

                for (const pair of obj.items) {
                    const key = pair.key.value
                    const item = pair.value as YAMLItem ?? null

                    try {
                        object[key] = this.transform(item, schema.any.interface)
                    } catch (err) {
                        if (err instanceof YAMLSchemaError) {
                            err.paths.push(key)
                            throw new YAMLSchemaError(err.code, err.something, err.paths)
                        }

                        throw err
                    }
                }

                return object
            }
        }

        if (lengthErrors.length) {
            throw new YAMLSchemaError(ErrorCodes.ObjectLengthPassed, `${lengthErrors.join("\n          ")}`, [])
        }

        throw lastError
    }
}
