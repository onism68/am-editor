import { MarkPlugin } from '@aomao/engine';

export type Options = {
	hotkey?: string | Array<string>;
	markdown?: boolean;
};
export default class extends MarkPlugin<Options> {
	static get pluginName() {
		return 'italic';
	}

	tagName = 'em';

	markdown = this.options.markdown !== false ? '_' : '';

	hotkey() {
		return this.options.hotkey || 'mod+i';
	}
}
