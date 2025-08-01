import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";

const KENALL_API_BASE_URL = "https://api.kenall.jp/v1";

interface PostalCodeResponse {
  version: string;
  data: Array<{
    postal_code: string;
    prefecture: string;
    city: string;
    town: string;
    prefecture_kana: string;
    city_kana: string;
    town_kana: string;
    koaza: string;
    kyoto_street: string;
    building: string;
    floor: string;
    town_partial: boolean;
    town_addressed_koaza: boolean;
    town_chome: boolean;
    town_multi: boolean;
    town_raw: string;
  }>;
}

class KenallMCPServer {
  private server: Server;
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.KENALL_API_KEY;
    this.server = new Server(
      {
        name: "kenall-mcp",
        version: "0.1.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "lookup_postal_code",
          description: "Look up address information from a Japanese postal code",
          inputSchema: {
            type: "object",
            properties: {
              postalCode: {
                type: "string",
                description: "Japanese postal code (e.g., '1000001' or '100-0001')",
              },
            },
            required: ["postalCode"],
          },
        },
        {
          name: "search_address",
          description: "Search for postal codes by address",
          inputSchema: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Address query in Japanese",
              },
              prefecture: {
                type: "string",
                description: "Prefecture name to filter results",
              },
              city: {
                type: "string",
                description: "City name to filter results",
              },
            },
            required: ["query"],
          },
        },
      ],
    }));

    this.server.setRequestHandler(
      CallToolRequestSchema,
      async (request) => {
        if (!this.apiKey) {
          throw new Error(
            "KENALL_API_KEY environment variable is not set. Please set it to use the Kenall API."
          );
        }

        switch (request.params.name) {
          case "lookup_postal_code":
            return await this.lookupPostalCode(request.params.arguments);
          case "search_address":
            return await this.searchAddress(request.params.arguments);
          default:
            throw new Error(`Unknown tool: ${request.params.name}`);
        }
      }
    );
  }

  private async lookupPostalCode(args: any) {
    const postalCode = args.postalCode.replace(/-/g, "");
    
    try {
      const response = await axios.get<PostalCodeResponse>(
        `${KENALL_API_BASE_URL}/postalcode/${postalCode}`,
        {
          headers: {
            Authorization: `Token ${this.apiKey}`,
          },
        }
      );

      if (response.data.data.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No address found for postal code: ${args.postalCode}`,
            },
          ],
        };
      }

      const addresses = response.data.data.map((addr) => ({
        postalCode: addr.postal_code,
        prefecture: addr.prefecture,
        city: addr.city,
        town: addr.town,
        prefectureKana: addr.prefecture_kana,
        cityKana: addr.city_kana,
        townKana: addr.town_kana,
      }));

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(addresses, null, 2),
          },
        ],
      };
    } catch (error: any) {
      if (error.response?.status === 404) {
        return {
          content: [
            {
              type: "text",
              text: `Postal code not found: ${args.postalCode}`,
            },
          ],
        };
      }
      throw new Error(`Failed to lookup postal code: ${error.message}`);
    }
  }

  private async searchAddress(args: any) {
    try {
      const params: any = {
        q: args.query,
      };
      
      if (args.prefecture) {
        params.prefecture = args.prefecture;
      }
      
      if (args.city) {
        params.city = args.city;
      }

      const response = await axios.get(
        `${KENALL_API_BASE_URL}/postalcode`,
        {
          headers: {
            Authorization: `Token ${this.apiKey}`,
          },
          params,
        }
      );

      if (response.data.data.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No results found for query: ${args.query}`,
            },
          ],
        };
      }

      const results = response.data.data.map((addr: any) => ({
        postalCode: addr.postal_code,
        prefecture: addr.prefecture,
        city: addr.city,
        town: addr.town,
      }));

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(results, null, 2),
          },
        ],
      };
    } catch (error: any) {
      throw new Error(`Failed to search address: ${error.message}`);
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Kenall MCP server running on stdio");
  }
}

const server = new KenallMCPServer();
server.run().catch(console.error);