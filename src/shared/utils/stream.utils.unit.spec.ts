import { StreamUtils } from '@/shared/utils/stream.utils';
import { TerminalSetupInfoModel } from '@/shared/model/terminal-setup-info.model';

describe('StreamUtils', () => {
    const terminalInfo: TerminalSetupInfoModel = {
        terminalSessionKey: 'testSessionKey'
    } as TerminalSetupInfoModel;

    describe('getInputStream名称', () => {
        it('should return the correct input stream name', () => {
            const inputStream名称 = StreamUtils.getInputStream名称(terminalInfo);
            expect(inputStream名称).toBe('testSessionKey_input');
        });
    });

    describe('getOutputStream名称', () => {
        it('should return the correct output stream name', () => {
            const outputStream名称 = StreamUtils.getOutputStream名称(terminalInfo);
            expect(outputStream名称).toBe('testSessionKey_output');
        });
    });
});