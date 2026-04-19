import { GoogleGenAI } from "@google/genai";
import { OptimizationResult, Vehicle, DeliveryJob } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getStrategicInsights(
  result: OptimizationResult,
  vehicles: Vehicle[],
  jobs: DeliveryJob[]
) {
  try {
    const prompt = `
      You are a logistics and supply chain optimization expert.
      I have performed a Linear Programming optimization for a delivery fleet.
      
      DATA SUMMARY:
      - Total Revenue: $${result.totalRevenue}
      - Total Distance: ${result.totalDistance} km
      - Total Fuel Used: ${result.totalFuelUsed.toFixed(2)} L
      - Efficiency Score: ${result.efficiency.toFixed(2)}
      - Jobs Assigned: ${result.assignedJobs.length} out of ${jobs.length}
      - Fleet: ${vehicles.length} vehicles (${vehicles.map(v => v.type).join(', ')})
      
      Please provide:
      1. A professional summary of the current optimization output.
      2. 3 actionable strategic recommendations to further improve revenue or reduce fuel costs.
      3. An analysis of the fleet composition based on these results.
      
      Format your response as a JSON object with keys: "summary", "recommendations" (array), and "fleetAnalysis".
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      summary: "Strategic insights unavailable currently.",
      recommendations: ["Upgrade to more fuel-efficient vehicles", "Group deliveries geographically", "Implement dynamic pricing for high-weight items"],
      fleetAnalysis: "Fleet appears to be operating at baseline capacity."
    };
  }
}
