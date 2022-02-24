# yaml-schema
> YAML document schema validator and transformer

[![NPM Version](https://img.shields.io/npm/v/yaml-schema.svg?maxAge=3600)](https://www.npmjs.com/package/yaml-schema)
[![NPM Downloads](https://img.shields.io/npm/dt/yaml-schema.svg?maxAge=3600)](https://www.npmjs.com/package/yaml-schema)

## Example
```js
import { readFileSync } from "node:fs"
import { YAML } from "yaml-schema"

const configFile = readFIleSync("config.yml", "utf-8")

const yaml = new YAML({
    type: "object",
    props: {
        id: {
            type: "string"
        },
        token: {
            type: "string
        }
    }
})

const config = yaml.parse(configFile)
```

## How To Use
```js
import { YAML } from "yaml-schema"

const yaml = new YAML(schema)
yaml.parse(yamlString)
```

## Schema
```js
const yaml = new YAML({
    type: schemaType
    default?: defaultValue
})
```

Example:
```js
const yaml = new YAML({
    type: "object",
    props: {
        name: {
            type: "string"
        }
    }
})
```

Types:
- any
- boolean
- number
- string
- choices
- array
- object

### Schema Additional Properties
`number` schema:
```js
const yaml = new YAML({
    type: "number",
    limit?: {
        min?: number,
        max?: number
    }
})
```

`string` schema:
```js
const yaml = new YAML({
    type: "string",
    length?: {
        min?: number,
        max?: number
    }
})
```

`choices` schema:
choices allow numbers and strings
```js
const yaml = new YAML({
    type: "choices",
    choices: [
        "first choice",
        "second choice",
        "third choice"
    ]
})

```

`array` schema:
```js
const yaml = new YAML({
    type: "array",
    element: anotherSchema,
    length?: {
        min?: number,
        max?: number
    }
})
```
```js
const yaml = new YAML({
    type: "array",
    element: {
        type: "string"
    },
    length?: {
        min?: number,
        max?: number
    }
})
```

`object` schema:
```js
const yaml = new YAML({
    type: "object",
    props: {
        name: schema
    }
})
```
```js
const yaml = new YAML({
    type: "object",
    props: {
        name: {
            type: "string",
            length: {
                max: 100
            }
        }
    }
})
```
or
```js
const yaml = new YAML({
    type: "object",
    any: {
        interface: schema,
        length?: {
            min?: number,
            max?: number
        }
    }
})
```
```js
const yaml = new YAML({
    type: "object",
    any: {
        interface: {
            type: "number",
            limit: {
                min: 10,
                max: 100
            }
        },
        length?: {
            min?: number,
            max?: number
        }
    }
})
```
