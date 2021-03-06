import { CommandWrapper } from '../../src/interfaces';
import { stub, spy } from 'sinon';

export type GroupDef = [
	{
		groupName: string;
		commands: [
			{
				commandName: string;
				fails?: boolean;
			}
		];
	}
];

export interface CommandWrapperConfig {
	group?: string;
	name?: string;
	description?: string;
	path?: string;
	runs?: boolean;
	eject?: boolean;
}

export function getCommandsMap(groupDef: GroupDef, registerMock?: Function) {
	const commands = new Map();
	if (registerMock === undefined) {
		registerMock = (compositeKey: string) => {
			return (func: Function) => {
				func('key', {});
				return compositeKey;
			};
		};
	}

	groupDef.forEach((group) => {
		group.commands.forEach((command) => {
			const compositeKey = `${group.groupName}-${command.commandName}`;
			const runSpy = spy(
				() => (command.fails ? Promise.reject(new Error(compositeKey)) : Promise.resolve(compositeKey))
			);
			const commandWrapper = {
				name: command.commandName,
				group: group.groupName,
				description: compositeKey,
				register: registerMock!(compositeKey),
				runSpy,
				run: runSpy
			};
			commands.set(compositeKey, commandWrapper);
		});
	});

	return commands;
}

const yargsFunctions = ['demand', 'usage', 'epilog', 'help', 'alias', 'strict', 'option'];
export function getYargsStub(aliases: any = {}) {
	const yargsStub: any = {
		parsed: {
			aliases
		}
	};
	yargsFunctions.forEach((fnc) => {
		yargsStub[fnc] = stub().returns(yargsStub);
	});
	yargsStub.command = stub()
		.callsArgWith(2, yargsStub)
		.returns(yargsStub);
	return yargsStub;
}

export function getCommandWrapper(name: string, runs: boolean = true) {
	return getCommandWrapperWithConfiguration({
		name,
		runs,
		group: 'foo',
		description: 'test-description'
	});
}

export function getCommandWrapperWithConfiguration(config: CommandWrapperConfig): CommandWrapper {
	const { group = '', name = '', description = '', path = '', runs = false, eject = false } = config;

	const commandWrapper: CommandWrapper = {
		group,
		name,
		description,
		path,
		register: stub().returns('registered'),
		run: stub().returns(runs ? 'success' : 'error')
	};

	if (eject) {
		commandWrapper.eject = stub().returns({});
	}

	return commandWrapper;
}
