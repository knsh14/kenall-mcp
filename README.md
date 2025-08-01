# Kenall MCP Server

An MCP (Model Context Protocol) server that provides access to the Kenall postal code API for Japanese address lookups.

## Features

- Look up address information from Japanese postal codes
- Search for postal codes by address
- Support for both hyphenated and non-hyphenated postal code formats

## Prerequisites

- Node.js 18 or higher
- A Kenall API key (get one at https://kenall.jp/)

## Installation

```bash
npm install -g kenall-mcp
```

Or use directly with npx:
```bash
npx kenall-mcp
```

## Configuration

Set your Kenall API key as an environment variable:

```bash
export KENALL_API_KEY="your-api-key-here"
```

## Building (for development)

```bash
npm run build
```

## Running

### Using npx (recommended):
```bash
KENALL_API_KEY="your-api-key-here" npx kenall-mcp
```

### After global installation:
```bash
KENALL_API_KEY="your-api-key-here" kenall-mcp
```

### Development mode (with auto-reload):
```bash
npm run dev
```

### Production mode (from source):
```bash
npm start
```

## MCP Client Configuration

To use this server with an MCP client, add the following to your MCP client configuration:

### Using npx (recommended):
```json
{
  "mcpServers": {
    "kenall": {
      "command": "npx",
      "args": ["kenall-mcp"],
      "env": {
        "KENALL_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### Using global installation:
```json
{
  "mcpServers": {
    "kenall": {
      "command": "kenall-mcp",
      "env": {
        "KENALL_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### Using local installation:
```json
{
  "mcpServers": {
    "kenall": {
      "command": "node",
      "args": ["/path/to/kenall-mcp/dist/index.js"],
      "env": {
        "KENALL_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

## Available Tools

### lookup_postal_code
Look up address information from a Japanese postal code.

Parameters:
- `postalCode` (string, required): Japanese postal code (e.g., '1000001' or '100-0001')

### search_address
Search for postal codes by address.

Parameters:
- `query` (string, required): Address query in Japanese
- `prefecture` (string, optional): Prefecture name to filter results
- `city` (string, optional): City name to filter results

## Example Usage

Looking up a postal code:
```json
{
  "tool": "lookup_postal_code",
  "arguments": {
    "postalCode": "100-0001"
  }
}
```

Searching by address:
```json
{
  "tool": "search_address",
  "arguments": {
    "query": "千代田",
    "prefecture": "東京都"
  }
}
```

## License

MIT