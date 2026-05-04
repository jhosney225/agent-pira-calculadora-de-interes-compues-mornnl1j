const Anthropic = require("@anthropic-ai/sdk");
const readline = require("readline");

const client = new Anthropic();
const conversationHistory = [];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function chat(userMessage) {
  conversationHistory.push({
    role: "user",
    content: userMessage,
  });

  const response = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    system: `You are a financial advisor specializing in compound interest calculations for long-term investments. 
You help users understand how their investments will grow over time using the compound interest formula: A = P(1 + r/n)^(nt)
Where:
- A = Final amount
- P = Principal (initial investment)
- r = Annual interest rate (as a decimal)
- n = Number of times interest is compounded per year
- t = Time in years

Always provide clear explanations and calculations. When the user provides investment details, calculate and explain the results.
Help them understand the power of compound interest for long-term wealth building.`,
    messages: conversationHistory,
  });

  const assistantMessage = response.content[0].text;
  conversationHistory.push({
    role: "assistant",
    content: assistantMessage,
  });

  return assistantMessage;
}

function calculateCompoundInterest(principal, rate, time, compounds) {
  const amount = principal * Math.pow(1 + rate / compounds / 100, compounds * time);
  const interest = amount - principal;
  return {
    principal: principal,
    rate: rate,
    time: time,
    compounds: compounds,
    finalAmount: parseFloat(amount.toFixed(2)),
    totalInterest: parseFloat(interest.toFixed(2)),
    annualGrowth: parseFloat((interest / time).toFixed(2)),
  };
}

async function main() {
  console.log("=".repeat(60));
  console.log("CALCULADORA DE INTERÉS COMPUESTO PARA INVERSIONES");
  console.log("=".repeat(60));
  console.log(
    "¡Bienvenido! Soy tu asesor financiero de IA. Te ayudaré a entender"
  );
  console.log(
    "cómo crecerá tu dinero con interés compuesto a largo plazo.\n"
  );

  let continueChat = true;

  while (continueChat) {
    const userInput = await askQuestion("\nTú: ");

    if (
      userInput.toLowerCase() === "salir" ||
      userInput.toLowerCase() === "exit"
    ) {
      console.log(
        "\n¡Gracias por usar la Calculadora de Interés Compuesto! ¡Hasta luego!"
      );
      continueChat = false;
      break;
    }

    if (userInput.trim() === "") {
      continue;
    }

    try {
      // Check if the user is asking for a calculation
      const lowerInput = userInput.toLowerCase();
      if (
        lowerInput.includes("calcul") ||
        lowerInput.includes("invert") ||
        lowerInput.includes("interes") ||
        lowerInput.includes("cuanto")
      ) {
        // Try to extract numbers for automatic calculation
        const numberPattern = /(\d+(?:[\.,]\d+)?)/g;
        const numbers = userInput.match(numberPattern);

        if (numbers && numbers.length >= 3) {
          // Assume format: principal, rate, years, [compounds per year]
          const principal = parseFloat(numbers[0].replace(",", "."));
          const rate = parseFloat(numbers[1].replace(",", "."));
          const years = parseFloat(numbers[2].replace(",", "."));
          const compounds = numbers[3]
            ? parseInt(numbers[3])
            : 12; // Default to monthly compounding

          const result = calculateCompoundInterest(
            principal,
            rate,
            years,
            compounds
          );

          const calculationMessage = `He detectado tu solicitud de cálculo. Basándome en los números que proporcionaste:
- Principal inicial: $${result.principal.toFixed(2)}
- Tasa de interés anual: ${result.rate}%
- Período: ${result.time} años
- Capitalización: ${result.compounds} veces por año

RESULTADOS DEL CÁLCULO:
- Monto final: $${result.finalAmount.toFixed(2)}
- Interés total ganado: $${result.totalInterest.toFixed(2)}
- Crecimiento promedio anual: $${result.annualGrowth.toFixed(2)}

Ahora permíteme ofrecerte análisis y recomendaciones sobre estos resultados.`;

          const response = await chat(calculationMessage);
          console.log("\nAsesor IA: " + response);
        } else {
          const response = await chat(userInput);
          console.log("\nAsesor IA: " + response);
        }
      } else {
        const response = await chat(userInput);
        console.log("\nAsesor IA: " + response);
      }
    } catch (error) {
      console.error("Error:", error.message);
      console.log("Disculpa, ocurrió un error. Intenta nuevamente.");
    }
  }

  rl.close();
}

main().catch(console.error);