# Assistant

A CLI-based personal assistant agent built with TypeScript and Anthropic Claude.

## Setup

1. Install dependencies:
   ```bash
   yarn install
   ```

2. Create `.env` file:
   ```bash
   cp .env.example .env
   ```

3. Add your Anthropic API key to `.env`

4. Run the assistant:
   ```bash
   yarn start
   ```

## Development

- `yarn start` - Run the assistant
- `yarn dev` - Run with auto-reload
- `yarn build` - Build TypeScript to JavaScript

## Project Structure

```
/src
  /core       - Agent logic and conversation management
  /tools      - Tool definitions and handlers
  /storage    - File-based persistence
  /prompts    - System prompts
  /types      - TypeScript type definitions
  main.ts     - CLI entry point
/data
  /conversations  - Saved conversations
  todos.json      - Task storage
```

## Status

🚧 Phase 1: Project setup (in progress)
