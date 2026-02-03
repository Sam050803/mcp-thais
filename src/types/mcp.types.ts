/**
 * Types pour le protocole MCP
 */

export interface McpTextContent {
  type: 'text';
  text: string;
}

export interface McpToolResult {
  content: McpTextContent[];
  isError?: boolean;
}

export function mcpSuccess(text: string): McpToolResult {
  return {
    content: [{ type: 'text', text }],
  };
}

export function mcpError(message: string): McpToolResult {
  return {
    content: [{ type: 'text', text: `❌ Erreur : ${message}` }],
    isError: true,
  };
}