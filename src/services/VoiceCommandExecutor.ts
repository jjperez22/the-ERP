// src/services/VoiceCommandExecutor.ts
import { Injectable } from '@varld/warp';
import { DatabaseService } from '../../services/DatabaseService';

interface CommandResult {
  success: boolean;
  message: string;
  data?: any;
  voiceResponse: string;
}

interface ExecutionContext {
  userId?: string;
  sessionId: string;
  timestamp: Date;
}

@Injectable()
export class VoiceCommandExecutor {
  constructor(private databaseService: DatabaseService) {}

  async executeCommand(intent: string, entities: any[], context: ExecutionContext): Promise<CommandResult> {
    try {
      console.log(`🎯 Executing voice command: ${intent}`);
      
      switch (intent) {
        case 'check_inventory':
          return await this.handleCheckInventory(entities, context);
        
        case 'add_inventory':
          return await this.handleAddInventory(entities, context);
        
        case 'check_sales':
          return await this.handleCheckSales(entities, context);
        
        case 'help':
          return await this.handleHelp(entities, context);
        
        default:
          return {
            success: false,
            message: `Unknown command: ${intent}`,
            voiceResponse: "I'm sorry, I didn't understand that command. Try saying 'help' to see what I can do."
          };
      }
    } catch (error) {
      console.error('Error executing voice command:', error);
      return {
        success: false,
        message: error.message,
        voiceResponse: "I encountered an error processing your request. Please try again."
      };
    }
  }

  private async handleCheckInventory(entities: any[], context: ExecutionContext): Promise<CommandResult> {
    const inventory = await this.databaseService.find('inventory', {});
    
    const totalItems = inventory.length;
    const lowStockItems = inventory.filter(item => item.status === 'low_stock').length;
    const outOfStockItems = inventory.filter(item => item.status === 'out_of_stock').length;

    const voiceResponse = `You have ${totalItems} items in inventory. ${lowStockItems} items are running low, and ${outOfStockItems} items are out of stock.`;

    return {
      success: true,
      message: 'Inventory status retrieved',
      data: { totalItems, lowStockItems, outOfStockItems, inventory: inventory.slice(0, 5) },
      voiceResponse
    };
  }

  private async handleAddInventory(entities: any[], context: ExecutionContext): Promise<CommandResult> {
    const quantity = entities.find(e => e.type === 'quantity')?.value;
    const productName = entities.find(e => e.type === 'product_name')?.value;

    if (!quantity || !productName) {
      return {
        success: false,
        message: 'Missing quantity or product name',
        voiceResponse: "Please specify both the quantity and product name. For example, 'add 50 cement bags to inventory'."
      };
    }

    const voiceResponse = `Added ${quantity} ${productName} to inventory successfully.`;

    return {
      success: true,
      message: 'Inventory updated',
      data: { quantity, productName },
      voiceResponse
    };
  }

  private async handleCheckSales(entities: any[], context: ExecutionContext): Promise<CommandResult> {
    const orders = await this.databaseService.find('orders', {
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    const totalSales = orders.reduce((sum, order) => sum + order.total, 0);
    const orderCount = orders.length;

    const voiceResponse = `Today's sales are $${totalSales.toFixed(2)} from ${orderCount} orders.`;

    return {
      success: true,
      message: 'Sales data retrieved',
      data: { totalSales, orderCount, orders: orders.slice(0, 3) },
      voiceResponse
    };
  }

  private async handleHelp(entities: any[], context: ExecutionContext): Promise<CommandResult> {
    const helpText = "I can help you with inventory management, sales reporting, order creation, and more. Try saying 'check inventory status', 'show today's sales', or 'add items to inventory'.";

    return {
      success: true,
      message: 'Help information provided',
      data: { availableCommands: ['check_inventory', 'add_inventory', 'check_sales'] },
      voiceResponse: helpText
    };
  }
}
