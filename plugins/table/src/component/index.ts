import {
	Card,
	CardToolbarItemOptions,
	CardType,
	EDITABLE_SELECTOR,
	isEngine,
	NodeInterface,
	Parser,
	Scrollbar,
	ToolbarItemOptions,
} from '@aomao/engine';
import {
	ControllBarInterface,
	HelperInterface,
	TableCommandInterface,
	TableInterface,
	TableSelectionInterface,
	TableValue,
	TemplateInterface,
} from '../types';
import Helper from './helper';
import Template from './template';
import menuData from './menu';
import ControllBar from './controllbar';
import TableSelection from './selection';
import TableCommand from './command';

class TableComponent extends Card<TableValue> implements TableInterface {
	readonly contenteditable: string[] = [
		`div${Template.TABLE_TD_CONTENT_CLASS}`,
	];

	static get cardName() {
		return 'table';
	}

	static get cardType() {
		return CardType.BLOCK;
	}

	static get selectStyleType(): 'background' {
		return 'background';
	}

	wrapper?: NodeInterface;
	helper: HelperInterface = new Helper(this.editor);
	template: TemplateInterface = new Template(this.editor, this);
	selection: TableSelectionInterface = new TableSelection(this.editor, this);
	conltrollBar: ControllBarInterface = new ControllBar(this.editor, this, {
		col_min_width: 40,
		row_min_height: 33,
	});
	command: TableCommandInterface = new TableCommand(this.editor, this);
	scrollbar?: Scrollbar;
	viewport?: NodeInterface;

	toolbar(): Array<ToolbarItemOptions | CardToolbarItemOptions> {
		return [
			{
				type: 'dnd',
			},
			{
				type: 'copy',
			},
			{
				type: 'delete',
			},
		];
	}

	getTableValue() {
		if (!this.wrapper) return;
		const tableRoot = this.wrapper.find(Template.TABLE_CLASS);
		if (!tableRoot) return;
		const { tableModel } = this.selection;
		if (!tableModel) return;
		const { $, schema, conversion } = this.editor;
		const container = $('<div></div>');
		container.append(tableRoot.clone(true));
		const parser = new Parser(container, this.editor, node => {
			node.find(Template.TABLE_TD_BG_CLASS).remove();
			node.find(EDITABLE_SELECTOR).each(root => {
				this.editor.node.unwrap($(root));
			});
		});
		const { rows, cols, height, width } = tableModel;
		const html = parser.toValue(schema, conversion.getValue(), false, true);
		return {
			rows,
			cols,
			height,
			width,
			html,
		};
	}

	activate(activated: boolean) {
		super.activate(activated);
		if (activated) this.wrapper?.addClass('active');
		else {
			this.selection.clearSelect();
			this.conltrollBar.hideContextMenu();
			this.wrapper?.removeClass('active');
		}
		this.scrollbar?.refresh();
	}

	onChange() {
		if (!isEngine(this.editor)) return;
		this.editor.history.hold();
		this.conltrollBar.refresh();
		this.selection.render('change');
		const value = this.getTableValue();
		if (value && value !== this.getValue()) this.setValue(value);
	}

	didRender() {
		this.selection.init();
		this.conltrollBar.init();
		this.command.init();

		this.viewport = this.wrapper?.find(
			isEngine(this.editor)
				? Template.VIEWPORT
				: Template.VIEWPORT_READER,
		);
		if (this.viewport) {
			this.scrollbar = new Scrollbar(
				this.editor,
				this.viewport,
				true,
				false,
				true,
			);
			this.scrollbar.on('display', (display: 'node' | 'block') => {
				if (display === 'block') {
					this.wrapper?.addClass('scrollbar-show');
				} else {
					this.wrapper?.removeClass('scrollbar-show');
				}
			});
		}
		this.scrollbar?.refresh();
		this.selection.on('select', () => {
			this.conltrollBar.refresh();
		});

		this.conltrollBar.on('sizeChanged', () => {
			this.selection.refreshModel();
			this.scrollbar?.refresh();
			this.onChange();
		});
		this.command.on('actioned', (action, silence) => {
			if (action === 'paste') {
				this.editor.card.render(this.wrapper);
			}
			this.selection.render(action);
			this.scrollbar?.refresh();
			if (!silence) {
				this.onChange();
			}
		});

		const tableRoot = this.wrapper?.find(Template.TABLE_CLASS);
		if (!tableRoot) return;
		this.editor.card.render(tableRoot);
		const value = this.getValue();
		if (!value?.html) this.onChange();
	}

	render() {
		const { $ } = this.editor;
		const value = this.getValue();
		if (!value) return 'Error value';
		if (value.html) {
			const model = this.helper.getTableModel($(value.html));
			value.rows = model.rows;
			value.cols = model.cols;
		}
		//渲染卡片
		this.wrapper = isEngine(this.editor)
			? $(
					this.template.htmlEdit(
						value,
						menuData(this.editor.language.get('table')),
					),
			  )
			: $(this.template.htmlView(value));
		return this.wrapper;
	}
}

export default TableComponent;

export { Template };
