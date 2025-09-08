// Construction ERP - Chart Utilities
import { ChartConfig, AnalyticsData } from '../types/index';

export class ChartUtils {
  private static chartInstances = new Map<string, any>();

  // Lazy load Chart.js when needed
  public static async loadChartJS(): Promise<any> {
    // Check if Chart is already available globally
    if (typeof window !== 'undefined' && (window as any).Chart) {
      return (window as any).Chart;
    }

    // Dynamic import for code splitting
    const chartModule = await import('chart.js');
    const { Chart, registerables } = chartModule;
    
    Chart.register(...registerables);
    
    // Make Chart available globally for future checks
    if (typeof window !== 'undefined') {
      (window as any).Chart = Chart;
    }
    
    console.log('📊 Chart.js loaded dynamically');
    return Chart;
  }

  // Create optimized chart with lazy loading
  public static async createChart(
    canvasId: string, 
    config: ChartConfig
  ): Promise<any> {
    try {
      const Chart = await this.loadChartJS();
      const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
      
      if (!canvas) {
        throw new Error(`Canvas element not found: ${canvasId}`);
      }

      // Destroy existing chart if exists
      if (this.chartInstances.has(canvasId)) {
        this.chartInstances.get(canvasId).destroy();
      }

      // Enhanced chart configuration with performance optimizations
      const optimizedConfig = {
        ...config,
        options: {
          ...config.options,
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: 'nearest',
            intersect: false,
          },
          plugins: {
            ...config.options?.plugins,
            legend: {
              display: true,
              position: 'top',
            },
            tooltip: {
              enabled: true,
              mode: 'index',
              intersect: false,
            },
          },
          scales: {
            ...config.options?.scales,
            x: {
              ...config.options?.scales?.x,
              ticks: {
                maxTicksLimit: 10, // Limit ticks for performance
              },
            },
            y: {
              ...config.options?.scales?.y,
              ticks: {
                maxTicksLimit: 8,
              },
            },
          },
          // Performance optimizations
          animation: {
            duration: config.options?.animation?.duration || 1000,
          },
          elements: {
            line: {
              tension: 0.4,
            },
            point: {
              radius: 3,
              hoverRadius: 5,
            },
          },
        },
      };

      const chart = new Chart(canvas, optimizedConfig);
      this.chartInstances.set(canvasId, chart);
      
      console.log(`📊 Chart created: ${canvasId}`);
      return chart;
      
    } catch (error) {
      console.error(`❌ Failed to create chart ${canvasId}:`, error);
      throw error;
    }
  }

  // Update chart data efficiently
  public static updateChart(canvasId: string, newData: AnalyticsData): boolean {
    const chart = this.chartInstances.get(canvasId);
    
    if (!chart) {
      console.warn(`⚠️ Chart not found for update: ${canvasId}`);
      return false;
    }

    // Update data efficiently
    chart.data.labels = newData.labels;
    chart.data.datasets = newData.datasets;
    
    // Animate the update
    chart.update('active');
    
    console.log(`📊 Chart updated: ${canvasId}`);
    return true;
  }

  // Destroy chart and clean up memory
  public static destroyChart(canvasId: string): boolean {
    const chart = this.chartInstances.get(canvasId);
    
    if (chart) {
      chart.destroy();
      this.chartInstances.delete(canvasId);
      console.log(`🗑️ Chart destroyed: ${canvasId}`);
      return true;
    }
    
    return false;
  }

  // Generate color palette for charts
  public static generateColorPalette(count: number): string[] {
    const colors = [
      '#1FB8CD', '#FF6B6B', '#4ECDC4', '#45B7D1',
      '#96CEB4', '#FECA57', '#FF9FF3', '#54A0FF',
      '#5F27CD', '#00D2D3', '#FF9F43', '#10AC84',
    ];
    
    const palette: string[] = [];
    for (let i = 0; i < count; i++) {
      palette.push(colors[i % colors.length]);
    }
    
    return palette;
  }

  // Cleanup all charts
  public static cleanup(): void {
    this.chartInstances.forEach((chart, id) => {
      chart.destroy();
    });
    this.chartInstances.clear();
    console.log('🧹 All charts cleaned up');
  }
}

// Export for use in modules
export default ChartUtils;
