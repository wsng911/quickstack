import type http from "node:http";
import { Server } from "socket.io";
import terminalService from "./server/services/terminal.service";

class SocketIoServer {
	initialize(server: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>) {
		const io = new Server(server);
		const podLogs名称space = io.of("/pod-terminal");
		podLogs名称space.on("connection", (socket) => {
			terminalService.streamTerminal(socket);
		});
	};
}
const socketIoServer = new SocketIoServer();
export default socketIoServer;

