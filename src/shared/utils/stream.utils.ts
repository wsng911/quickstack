import { TerminalSetupInfoModel } from "../model/terminal-setup-info.model";

export class StreamUtils {

    static getInputStream名称(terminalInfo: TerminalSetupInfoModel) {
        return `${terminalInfo.terminalSessionKey}_input`;
    }

    static getOutputStream名称(terminalInfo: TerminalSetupInfoModel) {
        return `${terminalInfo.terminalSessionKey}_output`;
    }
}