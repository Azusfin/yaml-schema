export enum ErrorCodes {
    Required = "REQUIRED",
    InvalidType = "INVALID_TYPE",
    NumberLimitPassed = "NUMBER_LIMIT_PASSED",
    StringLengthPassed = "STRING_LENGTH_PASSED",
    ChoiceDoesntExist = "CHOICE_DOESNT_EXIST",
    ArrayLengthPassed = "ARRAY_LENGTH_PASSED",
    ObjectLengthPassed = "OBJECT_LENGTH_PASSED"
}

export class YAMLSchemaError extends Error {
    public code: ErrorCodes
    public something: string
    public paths: (string | number)[]

    public constructor(code: ErrorCodes, something: string, paths: (string | number)[]) {
        const pathMsg = paths.length
            ? paths.map(path => typeof path === "number" ? path.toString() : `"${path}"`).reverse().join(" -> ")
            : ""

        const message = `${something}${pathMsg ? ` at ${pathMsg}` : ""}`

        super(message)

        this.code = code
        this.something = something
        this.paths = paths
    }

    public get name(): string {
        return `YAMLSchemaError [${this.code}]`
    }
}
