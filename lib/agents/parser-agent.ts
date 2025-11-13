import { 
  IAgent, 
  AgentType, 
  AgentMessage, 
  AgentStatus, 
  MessageType,
  ParsedBillData 
} from './types';

export class ParserAgent implements IAgent {
  public readonly type = AgentType.PARSER;
  private status: AgentStatus = {
    type: AgentType.PARSER,
    state: 'idle',
    errorCount: 0
  };

  async process(message: AgentMessage): Promise<AgentMessage> {
    const startTime = Date.now();
    this.status.state = 'processing';

    try {
      const { extractedText } = message.data;

      if (!extractedText) {
        throw new Error('No extracted text provided');
      }

      console.log(`[Parser Agent] Parsing bill text...`);

      // Use AI to parse the bill (you can use OpenAI, Gemini, or Claude)
      const parsedData = await this.parseWithAI(extractedText);

      // Fallback to regex-based parsing if AI fails
      if (!parsedData.consumption?.kwh) {
        console.log(`[Parser Agent] AI parsing incomplete, trying regex fallback...`);
        const regexData = this.parseWithRegex(extractedText);
        Object.assign(parsedData, regexData);
      }

      console.log(`[Parser Agent] Parsing completed`);
      console.log(`[Parser Agent] Found consumption: ${parsedData.consumption?.kwh} kWh`);

      this.status.state = 'idle';
      this.status.lastProcessed = Date.now();

      return {
        from: AgentType.PARSER,
        to: AgentType.ORCHESTRATOR,
        type: MessageType.RESPONSE,
        data: {
          parsedData,
          rawText: extractedText,
          processingTime: Date.now() - startTime
        },
        timestamp: Date.now(),
        correlationId: message.correlationId
      };
    } catch (error) {
      this.status.state = 'error';
      this.status.errorCount = (this.status.errorCount || 0) + 1;

      console.error(`[Parser Agent] Error:`, error);

      return {
        from: AgentType.PARSER,
        to: AgentType.ORCHESTRATOR,
        type: MessageType.ERROR,
        data: {
          error: error instanceof Error ? error.message : 'Unknown parsing error',
          processingTime: Date.now() - startTime
        },
        timestamp: Date.now(),
        correlationId: message.correlationId
      };
    }
  }

  getStatus(): AgentStatus {
    return { ...this.status };
  }

  /**
   * Use AI to intelligently parse the bill text
   */
  private async parseWithAI(text: string): Promise<ParsedBillData> {
    // This would integrate with OpenAI, Gemini, or Claude
    // For now, using a mock implementation
    // You can replace this with actual AI API calls

    const apiKey = process.env.OPENAI_API_KEY || process.env.GOOGLE_API_KEY;
    
    if (!apiKey) {
      console.log(`[Parser Agent] No AI API key found, using regex parsing only`);
      return this.parseWithRegex(text);
    }

    try {
      // Example with OpenAI (uncomment when you have API key)
      /*
      const OpenAI = require('openai').default;
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a bill parsing expert. Extract structured data from Meralco electricity bills.
            Return JSON with: accountNumber, accountName, billingPeriod (from, to), dueDate, 
            totalAmount, currentCharges, consumption (current, previous, kwh), meterReading (current, previous).
            Only return valid JSON, no other text.`
          },
          {
            role: "user",
            content: text
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1
      });

      const parsed = JSON.parse(completion.choices[0].message.content || '{}');
      return parsed as ParsedBillData;
      */

      // For now, return regex-based parsing
      return this.parseWithRegex(text);
    } catch (error) {
      console.error(`[Parser Agent] AI parsing failed:`, error);
      return this.parseWithRegex(text);
    }
  }

  /**
   * Fallback regex-based parsing for Meralco bills
   */
  private parseWithRegex(text: string): ParsedBillData {
    const parsed: ParsedBillData = {
      confidence: 0.7
    };

    console.log(`[Parser Agent] Parsing text (${text.length} chars)`);

    // Extract account number (typically 11 digits)
    const accountMatch = text.match(/(?:account|acct|service\s*id)[\s#:]*(\d{11})/i);
    if (accountMatch) {
      parsed.accountNumber = accountMatch[1];
      console.log(`[Parser Agent] Found account: ${accountMatch[1]}`);
    }

    // Extract account name
    const nameMatch = text.match(/(?:name|account name)[:\s]*([A-Z][A-Z\s,\.]+?)(?:\n|account)/i);
    if (nameMatch) {
      parsed.accountName = nameMatch[1].trim();
    }

    // Extract total amount - try multiple patterns
    const amountPatterns = [
      /(?:total amount|amount due|total\s*due)[:\s]*(?:PHP|₱|P)?\s*([\d,]+\.?\d*)/i,
      /(?:PHP|₱|P)\s*([\d,]+\.?\d*)/,
      /amount[:\s]*(?:PHP|₱|P)?\s*([\d,]+\.?\d*)/i
    ];
    
    for (const pattern of amountPatterns) {
      const match = text.match(pattern);
      if (match) {
        parsed.totalAmount = parseFloat(match[1].replace(/,/g, ''));
        console.log(`[Parser Agent] Found amount: ₱${parsed.totalAmount}`);
        break;
      }
    }

    // Extract kWh consumption - try multiple patterns
    const kwhPatterns = [
      /(\d+(?:,\d+)?)\s*kWh/i,
      /consumption[:\s]*(\d+(?:,\d+)?)/i,
      /total\s*consumption[:\s]*(\d+(?:,\d+)?)/i,
      /kwh[:\s]*(\d+(?:,\d+)?)/i
    ];
    
    for (const pattern of kwhPatterns) {
      const match = text.match(pattern);
      if (match) {
        const kwh = parseFloat(match[1].replace(/,/g, ''));
        parsed.consumption = {
          current: 0,
          previous: 0,
          kwh
        };
        console.log(`[Parser Agent] Found consumption: ${kwh} kWh`);
        break;
      }
    }

    // Extract meter readings
    const meterMatch = text.match(/(?:present|current)[:\s]*(\d+(?:,\d+)?)/i);
    const prevMeterMatch = text.match(/(?:previous)[:\s]*(\d+(?:,\d+)?)/i);
    
    if (meterMatch && prevMeterMatch) {
      const current = parseFloat(meterMatch[1].replace(/,/g, ''));
      const previous = parseFloat(prevMeterMatch[1].replace(/,/g, ''));
      
      parsed.meterReading = { current, previous };
      
      if (!parsed.consumption?.kwh) {
        parsed.consumption = {
          current,
          previous,
          kwh: current - previous
        };
        console.log(`[Parser Agent] Calculated consumption from readings: ${current - previous} kWh`);
      }
    }

    // If we have amount but no consumption, estimate it (avg ₱11.5 per kWh)
    if (parsed.totalAmount && !parsed.consumption?.kwh) {
      const estimatedKwh = Math.round(parsed.totalAmount / 11.5);
      parsed.consumption = {
        current: 0,
        previous: 0,
        kwh: estimatedKwh
      };
      console.log(`[Parser Agent] Estimated consumption from amount: ${estimatedKwh} kWh`);
    }

    // Extract billing period
    const periodMatch = text.match(/(?:billing period|period covered)[:\s]*(\d{1,2}\/\d{1,2}\/\d{2,4})\s*(?:to|-)\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/i);
    if (periodMatch) {
      parsed.billingPeriod = {
        from: periodMatch[1],
        to: periodMatch[2]
      };
    }

    // Extract due date
    const dueMatch = text.match(/(?:due date|pay before)[:\s]*(\d{1,2}\/\d{1,2}\/\d{2,4})/i);
    if (dueMatch) {
      parsed.dueDate = dueMatch[1];
    }

    // Extract detailed charges breakdown
    const charges: any = {};
    
    // Generation charge
    const genMatch = text.match(/generation[:\s]*(?:PHP|₱|P)?\s*([\d,]+\.?\d*)/i);
    if (genMatch) {
      charges.generation = parseFloat(genMatch[1].replace(/,/g, ''));
    }
    
    // Transmission charge
    const transMatch = text.match(/transmission[:\s]*(?:PHP|₱|P)?\s*([\d,]+\.?\d*)/i);
    if (transMatch) {
      charges.transmission = parseFloat(transMatch[1].replace(/,/g, ''));
    }
    
    // Distribution/Supply/System charge
    const distMatch = text.match(/(?:distribution|supply|system)[:\s]*(?:PHP|₱|P)?\s*([\d,]+\.?\d*)/i);
    if (distMatch) {
      charges.distribution = parseFloat(distMatch[1].replace(/,/g, ''));
    }
    
    // System Loss charge
    const lossMatch = text.match(/(?:system loss|slc)[:\s]*(?:PHP|₱|P)?\s*([\d,]+\.?\d*)/i);
    if (lossMatch) {
      charges.systemLoss = parseFloat(lossMatch[1].replace(/,/g, ''));
    }
    
    // Subsidies
    const subsidyMatch = text.match(/(?:subsidy|discount|senior)[:\s]*(?:PHP|₱|P)?\s*-?\s*([\d,]+\.?\d*)/i);
    if (subsidyMatch) {
      charges.subsidies = parseFloat(subsidyMatch[1].replace(/,/g, ''));
    }
    
    // Taxes (VAT, etc.)
    const taxMatch = text.match(/(?:tax|vat|withholding)[:\s]*(?:PHP|₱|P)?\s*([\d,]+\.?\d*)/i);
    if (taxMatch) {
      charges.taxes = parseFloat(taxMatch[1].replace(/,/g, ''));
    }
    
    // Universal charges
    const ucMatch = text.match(/(?:universal charge|uc|environmental)[:\s]*(?:PHP|₱|P)?\s*([\d,]+\.?\d*)/i);
    if (ucMatch) {
      charges.universalCharges = parseFloat(ucMatch[1].replace(/,/g, ''));
    }
    
    // FIT-All (Feed-in Tariff)
    const fitMatch = text.match(/(?:fit-all|fit all|feed-in)[:\s]*(?:PHP|₱|P)?\s*([\d,]+\.?\d*)/i);
    if (fitMatch) {
      charges.fitAll = parseFloat(fitMatch[1].replace(/,/g, ''));
    }
    
    // Only add charges if we found at least one
    if (Object.keys(charges).length > 0) {
      parsed.charges = charges;
      console.log(`[Parser Agent] Found ${Object.keys(charges).length} charge breakdowns`);
    }

    console.log(`[Parser Agent] Parsing complete:`, {
      hasAccount: !!parsed.accountNumber,
      hasAmount: !!parsed.totalAmount,
      hasConsumption: !!parsed.consumption?.kwh,
      hasCharges: !!parsed.charges
    });

    return parsed;
  }
}
