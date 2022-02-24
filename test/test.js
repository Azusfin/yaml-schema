/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable prefer-arrow-callback */
/* eslint-disable func-names */
/* eslint-disable @typescript-eslint/space-before-function-paren */
const { readFileSync } = require("node:fs")
const assert = require("assert/strict")
const { YAML } = require("../")

describe("yaml-schema", function() {
    const yaml = new YAML({
        type: "object",
        props: {
            name: {
                type: "object",
                props: {
                    "first-name": {
                        type: "string"
                    },
                    "second-name": {
                        type: "string"
                    }
                }
            },
            "has-phone": {
                type: "boolean"
            },
            phone: {
                type: "object",
                props: {
                    country: {
                        type: "number"
                    },
                    area: {
                        type: "number"
                    },
                    number: {
                        type: "number"
                    }
                }
            },
            job: {
                type: "array",
                element: {
                    type: "choices",
                    choices: [
                        "Teacher",
                        "Driver"
                    ]
                }
            },
            address: {
                type: "object",
                props: {
                    country: {
                        type: "string"
                    },
                    state: {
                        type: "string"
                    },
                    city: {
                        type: "string"
                    }
                }
            },
            email: {
                type: "array",
                element: {
                    type: "object",
                    props: {
                        id: {
                            type: "string"
                        },
                        domain: {
                            type: "string"
                        }
                    }
                }
            }
        }
    })

    const valid = readFileSync("test/valid.yml", "utf-8")
    const invalid = readFileSync("test/invalid.yml", "utf-8")

    const obj = {
        name: {
            "first-name": "Andrew",
            "second-name": "Pablo"
        },
        "has-phone": true,
        phone: {
            country: 1,
            area: 415,
            number: 7323156
        },
        job: ["Teacher", "Driver"],
        address: {
            country: "USA",
            state: "California",
            city: "San Francisco"
        },
        email: [
            {
                id: "andrew1email135",
                domain: "ymail.com"
            },
            {
                id: "andrew2email531",
                domain: "gmail.com"
            }
        ]
    }

    const errorName = "YAMLSchemaError [CHOICE_DOESNT_EXIST]"
    const errorMsg = "Choice doesn't exists in the schema at \"job\" -> 0"

    it("Valid", function() {
        const parsed = yaml.parse(valid)
        assert.deepEqual(parsed, obj)
    })

    it("Invalid", function() {
        try {
            yaml.parse(invalid)
        } catch (err) {
            assert.deepEqual([err?.name, err?.message], [errorName, errorMsg])
        }
    })
})
