import { useEffect, useState } from "react";

const instructions = `
You are a helpful assistant that provides driving plans for remote controlled vehicles.
When the user asks for a driving plan, you will first design a plan, and then call the \`display_driving_plan\` function to show the plan to the user.
The driving plan should include a name and an array of commands.
Each command should have an action (one of 'FD', 'BK', 'LT', 'RT', 'WT') and an argument.
The action 'FD' means set the power to drive forward, 'BK' means set the power to drive backward,
'LT' means turn left (in degrees), 'RT' means turn right (in degrees), 
and 'WT' means wait for a specified time in milliseconds.
The argument for 'FD' and 'BK' should be a power percentage (0-100),
for 'LT' and 'RT' it should be an angle in degrees, and for 'WT' it should be a wait time in milliseconds.
Notice that the FD and BK commands do not instruct the vehicle to move for a given time, they just set the power.
Therefore, the driving plan should include a wait command after each FD or BK command to ensure the vehicle moves for a specified duration.
The vehicle moves 50 cm/sec. at 100% power, and linearly less at lower power, e.g 25 cm/sec. at 50% power.
The vehicle has a tank-like rotation mechanism, so when giving a turn command, such as 'LT' or 'RT', 
the vehicle will turn in place without moving forward or backward.
After turning left or right, you need to issue another command to move forward or backward,
since the vehicle will not automatically continue moving in the same power it was running before the turn.
There is no need to issue a command to stop the vehicle at the end of the plan,
as the vehicle will stop automatically after the last command is executed.
When asked, provide a driving plan that includes a name and an array of commands.
Do not reflect on the driving plan, just create it and call the \`display_driving_plan\` function.
Do not read out the plan aloud after planning, since it is already displayed to the user.
Just describe it briefly with the main points of the plan, and ask for confirmation or changes.
`;

const commandType = {
  action: {
    type: "string",
    description: "Operator to perform, one of 'FD', 'BK', 'LT', 'RT', 'WT'",
  },
  argument: {
    type: "number",
    description: `
Argument for the action,
power percent (0-100) for 'FD', 'BK',
angle in degrees for 'LT', 'RT',
and wait time in milliseconds for 'WT'
`,
  }
}

const commandsType = {
  type: "array",
  description: "Array of driving commands",
  items: {
    type: "object",
    description: "A driving command",
    properties: commandType,
  },
}

const planParameters = {
  type: "object",
  strict: true,
  properties: {
    plan_name: {
      type: "string",
      description: "A brief description of the driving plan",
    },
    commands: commandsType,
  },
  required: ["plan_name", "commands"],
}

const sessionUpdate = {
type: "session.update",
session: {
    instructions: instructions,
    speed: 1.2,
    tools: [
      {
        type: "function",
        name: "display_driving_plan",
        description: `Call this function to display to the user a plan for driving the remote controlled vehicle.`,
        parameters: planParameters,
      },
      {
        type: "function",
        name: "execute_driving_plan",
        description: `Call this function to execute the driving plan for the remote controlled vehicle.`,
        parameters: planParameters,
      }
    ],
    tool_choice: "auto",
  },
};

function FunctionCallOutput({ functionCallOutput }) {
  const { plan_name, commands } = JSON.parse(functionCallOutput.arguments);

  const commandList = commands.map((command, idx) => (
    <div key={idx} className="flex items-center gap-2">
      <span className="font-bold">{command.action}</span>
      <span>{command.argument}</span>
    </div>
  ));

  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-bold">Driving Plan: {plan_name}</h3>
      <div className="flex flex-col gap-1">{commandList}</div>
    </div>
  );
}

// Sends a POST request with JSON payload to /api/drive
async function sendDrivePlan(payload) {
  const response = await fetch('/api/drive', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return response.json();
}

export default function ToolPanel({
  isSessionActive,
  sendClientEvent,
  events,
}) {
  const [functionAdded, setFunctionAdded] = useState(false);
  const [functionCallOutput, setFunctionCallOutput] = useState(null);

  useEffect(() => {
    if (!events || events.length === 0) return;

    const firstEvent = events[events.length - 1];
    if (!functionAdded && firstEvent.type === "session.created") {
      sendClientEvent(sessionUpdate);
      setFunctionAdded(true);
    }

    const mostRecentEvent = events[0];
    if (
      mostRecentEvent.type === "response.done" &&
      mostRecentEvent.response.output
    ) {
      mostRecentEvent.response.output.forEach((output) => {
        if (output.type === "function_call") {
          if (output.name === "display_driving_plan") {
            setFunctionCallOutput(output);
            setTimeout(() => {
              sendClientEvent({
                type: "response.create",
                response: {
                  instructions: `ask the user if the plan is good, and if not, ask for changes.`,
                },
              });
            }, 500);
          } else if (output.name === "execute_driving_plan") {
            const payload = JSON.parse(output.arguments);
            sendDrivePlan(payload).then((response) => {
              console.log("Drive command response:", response);
              setFunctionCallOutput(null); // Clear the output after execution
            }).catch((error) => {
              console.error("Error executing driving plan:", error);
            });
          }
        }
      });
    }
  }, [events]);

  useEffect(() => {
    if (!isSessionActive) {
      setFunctionAdded(false);
      setFunctionCallOutput(null);
    }
  }, [isSessionActive]);

  return (
    <section className="h-full w-full flex flex-col gap-4">
      <div className="h-full bg-gray-50 rounded-md p-4">
        <h2 className="text-lg font-bold">Driving Plan Tool</h2>
        {isSessionActive ? (
          functionCallOutput ? (
            <FunctionCallOutput functionCallOutput={functionCallOutput} />
          ) : (
            <p>Display a driving plan...</p>
          )
        ) : (
          <p>Start the session to use this tool...</p>
        )}
      </div>
    </section>
  );
}