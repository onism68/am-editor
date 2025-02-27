import { Editor, EditorConfiguration } from 'codemirror';
import { EditorInterface, NodeInterface } from '@aomao/engine';

export type Options = {
	onSave?: (mode: string, value: string) => void;
	container?: NodeInterface;
};

export interface CodeBlockEditor {
	new (editor: EditorInterface, options: Options): CodeBlockEditorInterface;
}

export interface CodeBlockEditorInterface {
	codeMirror?: Editor;
	mode: string;
	container: NodeInterface;
	renderTemplate(): string;
	getConfig(value: string, mode?: string): EditorConfiguration;
	getSyntax(mode: string): string;
	create(mode: string, value: string, options?: EditorConfiguration): void;
	update(mode: string): void;
	render(mode: string, value: string): void;
	save(): void;
	focus(): void;
	/**
	 * 代码来自 runmode addon
	 * 支持行号需要考虑复制粘贴问题
	 *
	 * runmode 本身不支持行号，见 https://github.com/codemirror/CodeMirror/issues/3364
	 * 可参考的解法  https://stackoverflow.com/questions/14237361/use-codemirror-for-standalone-syntax-highlighting-with-line-numbers
	 *
	 * ref:
	 * - https://codemirror.net/doc/manual.html#addons
	 * - https://codemirror.net/addon/runmode/runmode.js
	 */
	runMode(
		string: string,
		modespec: string,
		callback: any,
		options: any,
	): void;
}
