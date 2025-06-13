# Lego realtime drive planning asistant

This is an example application showing how to use the [OpenAI Realtime API](https://platform.openai.com/docs/guides/realtime) with [WebRTC](https://platform.openai.com/docs/guides/realtime-webrtc).

## Installation and usage

Before you begin, you'll need an OpenAI API key - [create one in the dashboard here](https://platform.openai.com/settings/api-keys). Create a `.env` file from the example file and set your API key in there:

```bash
cp .env.example .env
```

Running this application locally requires [Node.js](https://nodejs.org/) to be installed. Install dependencies for the application with:

```bash
npm install
```

Start the application server with:

```bash
npm run dev
```

This should start the console application on [http://localhost:3000](http://localhost:3000).

## Functionality

This application demonstrates how to generate and display driving plans for a remote-controlled vehicle using the OpenAI Realtime API. The driving plans include a sequence of commands such as moving forward, backward, turning, and waiting, which are executed by the vehicle. The application provides the following features:

- **Driving Plan Generation**: The assistant generates a driving plan based on user input, including a name and a series of commands.
- **Command Types**: Commands include actions like forward (`FD`), backward (`BK`), left turn (`LT`), right turn (`RT`), and wait (`WT`), each with specific arguments such as power percentage, angle, or time.
- **Plan Visualization**: The generated driving plan is displayed in the UI for user review.
- **Interactive Feedback**: Users can confirm or request changes to the driving plan, enabling iterative refinement.

The vehicle's movement is simulated based on the provided commands, ensuring accurate execution of the driving plan.

This application uses [express](https://expressjs.com/) to serve the React frontend contained in the [`/client`](./client) folder. The server is configured to use [vite](https://vitejs.dev/) to build the React frontend.

For a more comprehensive example, see the [OpenAI Realtime Agents](https://github.com/openai/openai-realtime-agents) demo built with Next.js, using an agentic architecture inspired by [OpenAI Swarm](https://github.com/openai/swarm).

## Previous WebSockets version

The previous version of this application that used WebSockets on the client (not recommended in browsers) [can be found here](https://github.com/openai/openai-realtime-console/tree/websockets).

## License

MIT
