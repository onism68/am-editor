import {
	TableInterface,
	ControllBarInterface,
	ControllDragging,
	ControllChangeSize,
	ControllOptions,
	ControllDraggingHeader,
} from '../types';
import { EventEmitter2 } from 'eventemitter2';
import {
	$,
	ActiveTrigger,
	EditorInterface,
	isEngine,
	isHotkey,
	NodeInterface,
} from '@aomao/engine';
import Template from './template';

class ControllBar extends EventEmitter2 implements ControllBarInterface {
	private editor: EditorInterface;
	private table: TableInterface;
	private readonly COL_MIN_WIDTH: number;
	private readonly ROW_MIN_HEIGHT: number;
	tableRoot?: NodeInterface;
	colsHeader?: NodeInterface;
	rowsHeader?: NodeInterface;
	tableHeader?: NodeInterface;
	menuBar?: NodeInterface;

	dragging?: ControllDragging;
	draggingHeader?: ControllDraggingHeader;
	changeSize?: ControllChangeSize;

	viewport?: NodeInterface;
	placeholder?: NodeInterface;
	contextVisible: boolean = false;
	//行删除按钮
	rowDeleteButton?: NodeInterface;
	//列删除按钮
	colDeleteButton?: NodeInterface;
	//列增加按钮相关
	colAddButton?: NodeInterface;
	colAddButtonSplit?: NodeInterface;
	moveColIndex: number = -1;
	hideColAddButtonTimeount?: NodeJS.Timeout;
	//行增加按钮相关
	rowAddButton?: NodeInterface;
	rowAddButtonSplit?: NodeInterface;
	moveRowIndex: number = -1;
	hideRowAddButtonTimeount?: NodeJS.Timeout;

	constructor(
		editor: EditorInterface,
		table: TableInterface,
		options: ControllOptions,
	) {
		super();
		this.table = table;
		this.editor = editor;
		this.COL_MIN_WIDTH = options.col_min_width;
		this.ROW_MIN_HEIGHT = options.row_min_height;
	}

	init() {
		const { wrapper } = this.table;
		if (!wrapper) return;
		this.tableRoot = wrapper.find(Template.TABLE_CLASS);
		this.colsHeader = wrapper.find(Template.COLS_HEADER_CLASS);
		this.rowsHeader = wrapper.find(Template.ROWS_HEADER_CLASS);
		this.tableHeader = wrapper.find(Template.HEADER_CLASS);
		this.viewport = wrapper.find(Template.VIEWPORT);
		this.menuBar = wrapper.find(Template.MENUBAR_CLASS);
		this.placeholder = wrapper.find(Template.PLACEHOLDER_CLASS);
		this.rowDeleteButton = this.rowsHeader?.find(
			Template.ROW_DELETE_BUTTON_CLASS,
		);
		this.colDeleteButton = wrapper.find(Template.COL_DELETE_BUTTON_CLASS);
		this.colAddButton = this.colsHeader?.find(
			Template.COL_ADD_BUTTON_CLASS,
		);
		this.colAddButtonSplit = this.colAddButton.find(
			Template.COL_ADD_BUTTON_SPLIT_CLASS,
		);
		this.rowAddButton = this.rowsHeader?.find(
			Template.ROW_ADD_BUTTON_CLASS,
		);
		this.rowAddButtonSplit = this.rowAddButton.find(
			Template.ROW_ADD_BUTTON_SPLIT_CLASS,
		);
		this.renderRowBars();
		this.renderColBars();
		this.bindEvents();
	}

	renderRowBars(start: number = 0, end?: number) {
		const table = this.tableRoot?.get<HTMLTableElement>();
		if (!table) return;
		const trs = table.rows;
		end = end || trs.length;
		const rowBars = this.rowsHeader?.find(Template.ROWS_HEADER_ITEM_CLASS);
		for (let i = start; i < end; i++) {
			rowBars?.eq(i)?.css('height', `${trs[i].offsetHeight}px`);
		}
	}

	renderColBars() {
		const table = this.tableRoot?.get<HTMLTableElement>();
		if (!table) return;
		const tableWidth = table.offsetWidth;
		this.tableRoot?.css('width', `${tableWidth}px`);
		this.colsHeader?.css('width', `${tableWidth}px`);

		const cols = this.tableRoot?.find('col');
		if (!cols) return;

		let isInit = true;

		const colWidthArray = {};
		let allColWidth = 0;
		let colIndex = 0;
		cols.each((col, i) => {
			const colWidth = $(col).attributes('width');
			if (colWidth) {
				colWidthArray[i] = colWidth;
				allColWidth += parseInt(colWidth);
				isInit = false;
			} else {
				colIndex++;
			}
		});
		const colBars = this.colsHeader?.find(Template.COLS_HEADER_ITEM_CLASS);
		if (!colBars) return;
		//初始化，col的宽度为0的时候
		if (isInit) {
			let tdWidth: Array<number> = [];
			const { tableModel } = this.table.selection;
			tableModel?.table?.forEach(trModel => {
				trModel.forEach((tdModel, c) => {
					if (
						!tdWidth[c] &&
						!this.table.helper.isEmptyModelCol(tdModel) &&
						!tdModel.isMulti &&
						tdModel.element
					) {
						tdWidth[c] = tdModel.element.offsetWidth;
					}
				});
			});
			// 合并单元格的存在，可能出现某些列全部属于合并单元格，导致无法通过 td 的 offsetWidth 直接获得，需要把剩余的未知行求平均数
			let unkownCount = 0;
			let knownWidth = 0;
			for (let c = 0; c < cols.length; c++) {
				if (!tdWidth[c]) {
					unkownCount++;
				} else {
					knownWidth += tdWidth[c];
				}
			}
			let averageWidth = 0;
			if (unkownCount > 0) {
				averageWidth = Math.round(
					(tableWidth - knownWidth) / unkownCount,
				);
			}
			for (let i = 0; i < cols.length; i++) {
				const width = tdWidth[i] || averageWidth;
				colBars.eq(i)?.css('width', width + 'px');
				cols.eq(i)?.attributes('width', width);
			}
		} else if (colIndex) {
			const averageWidth = Math.round(
				(tableWidth - allColWidth) / colIndex,
			);
			cols.each((_, index) => {
				const width =
					undefined === colWidthArray[index]
						? averageWidth
						: colWidthArray[index];
				colBars.eq(index)?.css('width', width + 'px');
				cols.eq(index)?.attributes('width', width);
			});
		} else {
			cols.each((_, index) => {
				const width = Math.round(
					(tableWidth * colWidthArray[index]) / allColWidth,
				);
				colBars.eq(index)?.css('width', width + 'px');
				cols.eq(index)?.attributes('width', width);
			});
		}
	}
	/**
	 * 绑定事件
	 */
	bindEvents() {
		this.colsHeader
			?.on('mousedown', event => this.onMouseDownColsHeader(event))
			.on('click', event => this.onClickColsHeader(event))
			.on('dragstart', event => this.onDragStartColsHeader(event));
		this.rowsHeader
			?.on('mousedown', event => this.onMouseDownRowsHeader(event))
			.on('click', event => this.onClickRowsHeader(event))
			.on('dragstart', event => this.onDragStartRowsHeader(event));
		this.tableHeader?.on('click', event => this.onClickTableHeader(event));
		this.tableRoot?.on('contextmenu', event => event.preventDefault());
		this.colsHeader?.on('contextmenu', event => event.preventDefault());
		this.rowsHeader?.on('contextmenu', event => event.preventDefault());
		this.tableRoot?.on('mousedown', event => this.onTableMouseDown(event));
		this.menuBar?.on('click', event => this.handleClickMenu(event));
		this.menuBar?.on('mouseover', event => this.handleHoverMenu(event));
		this.menuBar?.on('mouseleave', event => this.hideHighlight(event));
		//列头部 padding 区域单击让其选中表格卡片上方的blcok
		this.viewport?.on('mousedown', (event: MouseEvent) => {
			if (!event.target) return;
			const targetNode = $(event.target);
			if (
				!isEngine(this.editor) ||
				!event.target ||
				!this.viewport?.equal(targetNode)
			)
				return;
			event.preventDefault();
			event.stopPropagation();
			const { change } = this.editor;
			const range = change.getRange();
			this.table.focusPrevBlock(range, true);
			this.editor.card.activate(
				range.startNode,
				ActiveTrigger.MOUSE_DOWN,
			);
			this.editor.focus();
		});
		//行删除按钮
		this.rowDeleteButton
			?.on('mouseover', event => this.handleHighlightRow())
			.on('mouseleave', event => this.hideHighlight(event))
			.on('click', event => {
				this.table.command['removeRow']();
			});
		//列删除按钮
		this.colDeleteButton
			?.on('mouseover', event => this.handleHighlightCol())
			.on('mouseleave', event => this.hideHighlight(event))
			.on('click', event => {
				this.table.command['removeCol']();
			});
		//列增加按钮
		this.colAddButton
			?.on('mouseenter', () => {
				if (this.hideColAddButtonTimeount)
					clearTimeout(this.hideColAddButtonTimeount);
			})
			.on('mouseleave', () => {
				this.hideColAddButtonTimeount = setTimeout(() => {
					this.colAddButton?.hide();
					this.moveColIndex = -1;
				}, 200);
			})
			.on('click', () => {
				if (this.moveColIndex > -1)
					this.table.command.insertColAt(this.moveColIndex, 1);
			});
		this.colsHeader
			?.on('mouseenter', () => {
				if (this.hideColAddButtonTimeount)
					clearTimeout(this.hideColAddButtonTimeount);
			})
			.on('mousemove', (event: MouseEvent) =>
				this.onMouseMoveColsHeader(event),
			)
			.on('mouseleave', () => {
				this.hideColAddButtonTimeount = setTimeout(() => {
					this.colAddButton?.hide();
				}, 200);
			});
		//行增加按钮
		this.rowAddButton
			?.on('mouseenter', () => {
				if (this.hideRowAddButtonTimeount)
					clearTimeout(this.hideRowAddButtonTimeount);
				this.rowsHeader?.css('z-index', 2);
			})
			.on('mouseleave', () => {
				this.hideRowAddButtonTimeount = setTimeout(() => {
					this.rowAddButton?.hide();
					this.rowsHeader?.css('z-index', 1);
					this.moveRowIndex = -1;
				}, 200);
			})
			.on('click', () => {
				this.table.command.insertRowAt(this.moveRowIndex, 1, true);
			});

		this.rowsHeader
			?.on('mouseenter', () => {
				if (this.hideRowAddButtonTimeount)
					clearTimeout(this.hideRowAddButtonTimeount);
			})
			.on('mousemove', (event: MouseEvent) => {
				this.onMouseMoveRowsHeader(event);
				this.rowsHeader?.css('z-index', 2);
			})
			.on('mouseleave', () => {
				this.hideRowAddButtonTimeount = setTimeout(() => {
					this.rowsHeader?.css('z-index', '');
					this.rowAddButton?.hide();
				}, 200);
			});
	}
	/**
	 * 在表格上单击
	 * @param event
	 */
	onTableMouseDown(event: MouseEvent) {
		if (!event.target) return;
		const td = $(event.target).closest('td');
		if (td.length > 0 && event.button === 2) {
			this.showContextMenu(event);
		} else {
			this.hideContextMenu();
		}
	}

	/**
	 * 鼠标在列表头上移动
	 * @param event
	 */
	onMouseMoveColsHeader(event: MouseEvent) {
		if (!event.target || !this.colAddButton || !this.colAddButtonSplit)
			return;
		const targetNode = $(event.target);
		const itemNode = targetNode.closest(Template.COLS_HEADER_ITEM_CLASS);
		if (itemNode.length === 0) return;
		const items = this.colsHeader!.find(
			Template.COLS_HEADER_ITEM_CLASS,
		).toArray();
		const width = itemNode.width();
		const buttonWidth = this.colAddButton.width();
		let left = itemNode.get<HTMLElement>()!.offsetLeft;
		const index = items.findIndex(item => item.equal(itemNode));
		const isEnd =
			event.offsetX > width / 2 || targetNode.hasClass('cols-trigger');
		const isLast = items[items.length - 1].equal(itemNode);
		if (isEnd) {
			left += isLast ? width - buttonWidth / 2 : width;
		}
		this.moveColIndex = index + (isEnd ? 1 : 0);
		this.colAddButton?.show('flex');
		this.colAddButton.css('left', `${left}px`);
		const splitHeight =
			(this.table.selection.tableModel?.height || 0) +
			itemNode.height() +
			4;
		this.colAddButtonSplit.css('height', `${splitHeight}px`);
		this.colAddButtonSplit.css(
			'left',
			`${isLast && isEnd ? buttonWidth - 3 + 'px' : ''}`,
		);
	}

	/**
	 * 鼠标在行表头上移动
	 * @param event
	 * @returns
	 */
	onMouseMoveRowsHeader(event: MouseEvent) {
		if (!event.target || !this.rowAddButton || !this.rowAddButtonSplit)
			return;
		const targetNode = $(event.target);
		const itemNode = targetNode.closest(Template.ROWS_HEADER_ITEM_CLASS);
		if (itemNode.length === 0) return;
		const items = this.rowsHeader!.find(
			Template.ROWS_HEADER_ITEM_CLASS,
		).toArray();
		const height = itemNode.height();
		let top = itemNode.get<HTMLElement>()!.offsetTop;
		const index = items.findIndex(item => item.equal(itemNode));
		const isEnd =
			event.offsetY > height / 2 || targetNode.hasClass('rows-trigger');
		if (isEnd) {
			top += height;
		}
		this.moveRowIndex = index + (isEnd ? 1 : 0);
		this.rowAddButton.show('flex');
		this.rowAddButton.css('top', `${top}px`);
		const splitWidth =
			(this.table.selection.tableModel?.width || 0) +
			itemNode.width() +
			4;
		this.rowAddButtonSplit.css('width', `${splitWidth}px`);
	}

	/**
	 * 鼠标在列头部按下
	 * @param event 事件
	 * @returns
	 */
	onMouseDownColsHeader(event: MouseEvent) {
		const trigger = $(event.target || []).closest(
			Template.COLS_HEADER_TRIGGER_CLASS,
		);
		//不可移动状态
		if (trigger.length === 0) {
			//右键显示菜单
			if (event.button === 2) {
				this.showContextMenu(event);
			}
			return;
		}
		//开始调整列宽度
		this.startChangeCol(trigger, event);
	}
	/**
	 * 鼠标在行头部按下
	 * @param event 事件
	 * @returns
	 */
	onMouseDownRowsHeader(event: MouseEvent) {
		const trigger = $(event.target || []).closest(
			Template.ROWS_HEADER_TRIGGER_CLASS,
		);
		//不可移动状态
		if (trigger.length === 0) {
			//右键显示菜单
			if (event.button === 2) {
				this.showContextMenu(event);
			}
			return;
		}
		//开始调整行高度
		this.startChangeRow(trigger, event);
	}
	/**
	 * 鼠标在列头部单击
	 * @param event 事件
	 */
	onClickColsHeader(event: MouseEvent) {
		const { selection } = this.table;
		const trigger = $(event.target || []).closest(
			Template.COLS_HEADER_TRIGGER_CLASS,
		);
		if (trigger.length > 0) return;
		const colHeader = $(event.target || []).closest(
			Template.COLS_HEADER_ITEM_CLASS,
		);
		if (colHeader.length === 0) return;
		const index = this.colsHeader
			?.find(Template.COLS_HEADER_ITEM_CLASS)
			.toArray()
			.findIndex(item => item.equal(colHeader));
		if (index === undefined) return;
		selection.selectCol(index);
	}
	/**
	 * 鼠标在行头部单击
	 * @param event 事件
	 */
	onClickRowsHeader(event: MouseEvent) {
		const { selection } = this.table;
		const trigger = $(event.target || []).closest(
			Template.ROWS_HEADER_TRIGGER_CLASS,
		);
		if (trigger.length > 0) return;
		const rowHeader = $(event.target || []).closest(
			Template.ROWS_HEADER_ITEM_CLASS,
		);
		if (rowHeader.length === 0) return;
		const index = this.rowsHeader
			?.find(Template.ROWS_HEADER_ITEM_CLASS)
			.toArray()
			.findIndex(item => item.equal(rowHeader));
		if (index === undefined) return;
		selection.selectRow(index);
	}
	/**
	 * 鼠标在表格左上角头部单击
	 * @param event 事件
	 */
	onClickTableHeader(event: MouseEvent) {
		const { selection } = this.table;
		if (this.tableHeader?.hasClass('selected')) {
			selection.clearSelect();
		} else {
			const { tableModel } = selection;
			if (!tableModel) return;
			selection.select(
				{ row: 0, col: 0 },
				{ row: tableModel.rows - 1, col: tableModel.cols - 1 },
			);
		}
	}
	/**
	 * 激活表头状态
	 * @returns
	 */
	activeHeader() {
		const selectArea = this.table.selection.getSelectArea();
		this.clearActiveStatus();
		const colBars = this.colsHeader?.find(Template.COLS_HEADER_ITEM_CLASS);
		const rowBars = this.rowsHeader?.find(Template.ROWS_HEADER_ITEM_CLASS);
		const { begin, end, allCol, allRow } = selectArea;
		for (let r = begin.row; r <= end.row; r++) {
			if (allCol) {
				rowBars?.eq(r)?.addClass('selected');
				if (allRow) rowBars?.eq(r)?.addClass('no-dragger');
			}
		}

		for (let c = begin.col; c <= end.col; c++) {
			if (allRow) {
				colBars?.eq(c)?.addClass('selected');
				if (allCol) colBars?.eq(c)?.addClass('no-dragger');
			}
		}
		if (allCol && allRow) {
			this.tableHeader?.addClass('selected');
		} else {
			this.tableHeader?.removeClass('selected');
		}
		//行删除按钮
		if (allCol && !allRow) {
			const tr = this.tableRoot?.find('tr').eq(begin.row);
			if (tr) {
				const top = tr.get<HTMLElement>()!.offsetTop;
				this.rowDeleteButton?.show('flex');
				this.rowDeleteButton?.css(
					'top',
					`${top - this.rowDeleteButton.height()}px`,
				);
			}
		} else {
			this.rowDeleteButton?.hide();
		}
		//列删除按钮
		if (!allCol && allRow) {
			let width = 0;
			for (let c = begin.col; c <= end.col; c++) {
				width += colBars?.eq(c)?.width() || 0;
			}
			const left =
				colBars?.eq(begin.col)?.get<HTMLElement>()?.offsetLeft || 0;

			this.colDeleteButton?.show('flex');
			this.colDeleteButton?.css('left', `${left + width / 2}px`);
		} else {
			this.colDeleteButton?.hide();
		}
	}

	/**
	 * 清楚表头活动状态
	 */
	clearActiveStatus() {
		const colBars = this.colsHeader?.find(Template.COLS_HEADER_ITEM_CLASS);
		const rowBars = this.rowsHeader?.find(Template.ROWS_HEADER_ITEM_CLASS);
		colBars?.removeClass('selected');
		colBars?.removeClass('no-dragger');
		rowBars?.removeClass('selected');
		rowBars?.removeClass('no-dragger');
		this.tableHeader?.removeClass('selected');
	}
	/**
	 * 刷新控制UI
	 */
	refresh() {
		this.renderColBars();
		this.renderRowBars();
		this.activeHeader();
	}
	/**
	 * 开始改变列宽度
	 * @param col 列节点
	 * @param event 事件
	 */
	startChangeCol(trigger: NodeInterface, event: MouseEvent) {
		event.stopPropagation();
		event.preventDefault();
		const col = trigger.parent()!;
		const colElement = col.get<HTMLTableColElement>()!;
		this.table.selection.clearSelect();
		this.dragging = {
			x: event.clientX,
			y: -1,
		};
		const index =
			this.colsHeader
				?.find(Template.COLS_HEADER_ITEM_CLASS)
				.toArray()
				.findIndex(item => item.equal(col)) || 0;
		this.changeSize = {
			trigger: {
				element: trigger,
				height: trigger.height(),
				width: trigger.width(),
			},
			element: col,
			width: colElement.offsetWidth,
			height: -1,
			index,
			table: {
				width: this.table.selection.tableModel?.width || 0,
				height: this.table.selection.tableModel?.height || 0,
			},
		};
		this.bindChangeSizeEvent();
	}
	/**
	 * 开始改变行高度
	 * @param col 列节点
	 * @param event 事件
	 */
	startChangeRow(trigger: NodeInterface, event: MouseEvent) {
		event.stopPropagation();
		event.preventDefault();
		const row = trigger.parent()!;
		const rowElement = row.get<HTMLTableColElement>()!;
		this.table.selection.clearSelect();
		this.dragging = {
			x: -1,
			y: event.clientY,
		};
		const index =
			this.rowsHeader
				?.find(Template.ROWS_HEADER_ITEM_CLASS)
				.toArray()
				.findIndex(item => item.equal(row)) || 0;
		this.changeSize = {
			trigger: {
				element: trigger,
				height: trigger.height(),
				width: trigger.width(),
			},
			element: row,
			width: -1,
			height: rowElement.offsetHeight,
			index,
			table: {
				width: this.table.selection.tableModel?.width || 0,
				height: this.table.selection.tableModel?.height || 0,
			},
		};
		this.bindChangeSizeEvent();
	}
	/**
	 * 绑定改变大小事件
	 */
	bindChangeSizeEvent() {
		//添加鼠标样式
		this.colsHeader?.addClass('resize');
		this.rowsHeader?.addClass('resize');
		document.addEventListener('mousemove', this.onChangeSize);
		document.addEventListener('mouseup', this.onChangeSizeEnd);
		document.addEventListener('mouseleave', this.onChangeSizeEnd);
	}
	/**
	 * 移除绑定改变不大小事件
	 */
	unbindChangeSizeEvent() {
		//添加鼠标样式
		this.colsHeader?.removeClass('resize');
		this.rowsHeader?.removeClass('resize');
		document.removeEventListener('mousemove', this.onChangeSize);
		document.removeEventListener('mouseup', this.onChangeSizeEnd);
		document.removeEventListener('mouseleave', this.onChangeSizeEnd);
	}

	onChangeSize = (event: MouseEvent) => {
		if (!this.dragging) return;
		if (this.dragging.y > -1) {
			this.onChangeRowHeight(event);
		} else if (this.dragging.x > -1) {
			this.onChangeColWidth(event);
		}
	};
	/**
	 * 列宽度改变
	 * @param event 事件
	 * @returns
	 */
	onChangeColWidth(event: MouseEvent) {
		if (!this.dragging || !this.changeSize) return;
		//鼠标移动宽度
		let width = event.clientX - this.dragging.x;
		//获取合法的宽度
		const colWidth = Math.max(
			this.COL_MIN_WIDTH,
			this.changeSize.width + width,
		);
		//需要移动的宽度
		width = colWidth - this.changeSize.width;
		//表格变化后的宽度
		const tableWidth = this.changeSize.table.width + width;
		this.changeSize.element.css('width', colWidth + 'px');
		const currentElement = this.changeSize.element.get<HTMLElement>()!;
		this.colsHeader?.css('width', tableWidth + 'px');
		const viewportElement = this.viewport?.get<HTMLElement>()!;
		// 拖到边界时，需要滚动表格视窗的滚动条
		const currentColRightSide =
			currentElement.offsetLeft + currentElement.offsetWidth;
		if (
			currentColRightSide - viewportElement.scrollLeft + 20 >
			viewportElement.offsetWidth
		) {
			// 拖宽单元格时，若右侧已经到边，需要滚动左侧的滚动条
			viewportElement.scrollLeft =
				currentColRightSide + 20 - viewportElement.offsetWidth;
		} else if (
			viewportElement.scrollLeft + viewportElement.offsetWidth ===
			viewportElement.scrollWidth
		) {
			// 拖窄单元格时，若右侧已经到边，需要滚动左侧的滚动条
			viewportElement.scrollLeft = Math.max(
				0,
				tableWidth + 34 - viewportElement.offsetWidth,
			);
		}
		this.clearActiveStatus();
		this.hideContextMenu();
		this.renderRowBars();
		this.renderColSplitBars(
			this.changeSize.element,
			this.changeSize.trigger.element,
		);
		//设置列头宽度
		this.tableRoot
			?.find('col')
			.eq(this.changeSize.index)
			?.attributes('width', colWidth);
		//设置表格宽度
		this.tableRoot?.css('width', `${tableWidth}px`);
	}

	onChangeRowHeight(event: MouseEvent) {
		if (!this.dragging || !this.changeSize) return;
		let height = event.clientY - this.dragging.y;
		const rowHeight = Math.max(
			this.ROW_MIN_HEIGHT,
			this.changeSize.height + height,
		);
		height = rowHeight - this.changeSize.height;
		this.changeSize.element.css('height', rowHeight + 'px');
		this.clearActiveStatus();
		this.hideContextMenu();
		this.renderRowSplitBars(
			this.changeSize.element,
			this.changeSize.trigger.element,
		);
		this.tableRoot
			?.find('tr')
			.eq(this.changeSize.index)
			?.css('height', `${rowHeight}px`);
	}

	renderColSplitBars(col: NodeInterface, trigger: NodeInterface) {
		const tableHeight = this.table.selection.tableModel?.height || 0;
		trigger
			.addClass('dragging')
			.css('height', `${tableHeight + col.height()}px`);
	}

	renderRowSplitBars(row: NodeInterface, trigger: NodeInterface) {
		const viewportElement = this.viewport?.get<HTMLElement>()!;
		const tableWidth = this.table.selection.tableModel?.width || 0;
		const width = Math.min(viewportElement.offsetWidth, tableWidth);
		trigger.addClass('dragging').css('width', `${width + row.width()}px`);
	}

	onChangeSizeEnd = (event: MouseEvent) => {
		if (
			event.type === 'mouseleave' &&
			this.table.getCenter().contains(event['toElement'])
		) {
			return;
		}

		if (this.dragging && this.changeSize) {
			const { width, height, element } = this.changeSize.trigger;
			element.removeClass('dragging');
			if (this.dragging.x > -1) element.css('height', `${height}px`);
			if (this.dragging.y > -1) element.css('width', `${width}px`);
			this.dragging = undefined;
			// 拖完再渲染一次，行高会受内容限制，无法拖到你想要的高度
			this.renderRowBars();
			this.unbindChangeSizeEvent();
			this.emit('sizeChanged');
		}
	};

	onDragStartColsHeader(event: DragEvent) {
		event.stopPropagation();
		const { selection } = this.table;
		const selectArea = selection.getSelectArea();
		if (!event.target || !selectArea.allRow) return;
		const colBar = $(event.target).closest(Template.COLS_HEADER_ITEM_CLASS);
		if (colBar.length === 0) return;
		const index = this.colsHeader
			?.find(Template.COLS_HEADER_ITEM_CLASS)
			.toArray()
			.findIndex(item => item.equal(colBar));
		if (index === undefined) return;
		const drag_col = index;
		if (drag_col < selectArea.begin.col || drag_col > selectArea.end.col)
			return;
		this.draggingHeader = {
			element: colBar,
			minIndex: selectArea.begin.col,
			maxIndex: selectArea.end.col,
			count: selectArea.end.col - selectArea.begin.col + 1,
		};
		colBar.addClass('dragging');
		colBar
			.find('.drag-info')
			.html(
				this.editor.language
					.get<string>('table', 'draggingCol')
					.replace('$data', this.draggingHeader.count.toString()),
			);
		this.colsHeader?.addClass('dragging');
		this.table.helper.fixDragEvent(event);
		this.bindDragColEvent();
	}

	onDragStartRowsHeader(event: DragEvent) {
		event.stopPropagation();
		const { selection } = this.table;
		const selectArea = selection.getSelectArea();
		if (!event.target || !selectArea.allCol) return;
		const rowBar = $(event.target).closest(Template.ROWS_HEADER_ITEM_CLASS);
		if (rowBar.length === 0) return;
		const index = this.rowsHeader
			?.find(Template.ROWS_HEADER_ITEM_CLASS)
			.toArray()
			.findIndex(item => item.equal(rowBar));
		if (index === undefined) return;
		const drag_row = index;

		if (drag_row < selectArea.begin.row || drag_row > selectArea.end.row)
			return;
		this.draggingHeader = {
			element: rowBar,
			minIndex: selectArea.begin.row,
			maxIndex: selectArea.end.row,
			count: selectArea.end.row - selectArea.begin.row + 1,
		};
		rowBar.addClass('dragging');
		rowBar
			.find('.drag-info')
			.html(
				this.editor.language
					.get<string>('table', 'draggingRow')
					.replace('$data', this.draggingHeader.count.toString()),
			);
		this.rowsHeader?.addClass('dragging');
		this.table.helper.fixDragEvent(event);
		this.bindDragRowEvent();
	}

	bindDragColEvent() {
		const { wrapper } = this.table;
		wrapper?.on('dragover', this.onDragCol);
		wrapper?.on('drop', this.onDragColEnd);
		wrapper?.on('dragend', this.onDragColEnd);
	}

	unbindDragColEvent() {
		const { wrapper } = this.table;
		const colBars = this.colsHeader?.find(Template.COLS_HEADER_ITEM_CLASS);
		colBars?.removeClass('dragging');
		this.colsHeader?.removeClass('dragging');
		wrapper?.off('dragover', this.onDragCol);
		wrapper?.off('drop', this.onDragColEnd);
		wrapper?.off('dragend', this.onDragColEnd);
	}

	bindDragRowEvent() {
		const { wrapper } = this.table;
		wrapper?.on('dragover', this.onDragRow);
		wrapper?.on('drop', this.onDragRowEnd);
		wrapper?.on('dragend', this.onDragRowEnd);
	}

	unbindDragRowEvent() {
		const { wrapper } = this.table;
		const rowBars = this.rowsHeader?.find(Template.ROWS_HEADER_ITEM_CLASS);
		rowBars?.removeClass('dragging');
		this.rowsHeader?.removeClass('dragging');
		wrapper?.off('dragover', this.onDragRow);
		wrapper?.off('drop', this.onDragRowEnd);
		wrapper?.off('dragend', this.onDragRowEnd);
	}

	showPlaceHolder(dropIndex: number) {
		if (!this.draggingHeader) return;
		const { element, minIndex, maxIndex } = this.draggingHeader;
		if (element.closest(Template.COLS_HEADER_CLASS).length > 0) {
			if (dropIndex === this.draggingHeader.index) return;
			if (minIndex <= dropIndex && dropIndex <= maxIndex + 1) {
				delete this.draggingHeader.index;
				this.placeholder?.css('display', 'none');
				return;
			}

			this.draggingHeader.index = dropIndex;
			const colBars = this.colsHeader?.find(
				Template.COLS_HEADER_ITEM_CLASS,
			);
			if (!colBars) return;

			const left =
				this.draggingHeader.index !== colBars.length
					? colBars.eq(this.draggingHeader.index)!.get<HTMLElement>()!
							.offsetLeft + 2
					: colBars
							.eq(this.draggingHeader.index - 1)!
							.get<HTMLElement>()!.offsetLeft +
					  colBars
							.eq(this.draggingHeader.index - 1)!
							.get<HTMLElement>()!.offsetWidth +
					  2;
			const viewportElement = this.viewport?.get<HTMLElement>()!;
			const { scrollLeft, offsetWidth } = viewportElement;
			if (left < scrollLeft) {
				viewportElement.scrollLeft = left - 5;
			}
			if (left > scrollLeft + offsetWidth) {
				viewportElement.scrollLeft = left - offsetWidth + 5;
			}
			const height =
				(this.table.selection.tableModel?.height || 0) +
				colBars.height();
			this.placeholder?.css('width', '3px');
			this.placeholder?.css('height', `${height}px`);
			this.placeholder?.css('left', left + 'px');
			this.placeholder?.css('top', 0 + 'px');
			this.placeholder?.css('display', 'block');
		} else if (element.closest(Template.ROWS_HEADER_CLASS).length > 0) {
			if (dropIndex === this.draggingHeader.index) return;
			if (minIndex <= dropIndex && dropIndex <= maxIndex + 1) {
				delete this.draggingHeader.index;
				this.placeholder?.css('display', 'none');
				return;
			}
			this.draggingHeader.index = dropIndex;
			const rowBars = this.rowsHeader?.find(
				Template.ROWS_HEADER_ITEM_CLASS,
			);
			if (!rowBars) return;
			const top =
				this.draggingHeader.index !== rowBars.length
					? rowBars.eq(this.draggingHeader.index)!.get<HTMLElement>()!
							.offsetTop + 2
					: rowBars
							.eq(this.draggingHeader.index - 1)!
							.get<HTMLElement>()!.offsetTop +
					  rowBars
							.eq(this.draggingHeader.index - 1)!
							.get<HTMLElement>()!.offsetHeight +
					  2;
			const width = this.table.selection.tableModel?.width || 0;
			this.placeholder?.css('height', '3px');
			this.placeholder?.css('width', `${width}px`);
			this.placeholder?.css('left', '3px');
			this.placeholder?.css('top', 21 + top + 'px');
			this.placeholder?.css('display', 'block');
		}
	}

	onDragCol = (event: DragEvent) => {
		event.stopPropagation();
		if (!this.draggingHeader || !event.target) return;
		if (undefined === this.dragging) {
			this.dragging = {
				x: event.offsetX,
				y: event.offsetY,
			};
		}
		// dragover会不断的触发事件，这里做一个截流，鼠标在3像素以内不去计算
		if (Math.abs(this.dragging.x - event.offsetX) < 3) return;
		this.dragging.x = event.offsetX;
		this.draggingHeader.element.removeClass('dragging');
		const td = $(event.target).closest('td');
		const colBar = $(event.target).closest(Template.COLS_HEADER_ITEM_CLASS);
		if (td.length === 0 && colBar.length === 0) return;

		if (colBar.length > 0) {
			const index = this.colsHeader
				?.find(Template.COLS_HEADER_ITEM_CLASS)
				.toArray()
				.findIndex(item => item.equal(colBar));
			if (index === undefined) return;
			const currentCol = index;
			const _dropCol =
				event.offsetX > colBar.get<HTMLElement>()!.offsetWidth / 2
					? currentCol + 1
					: currentCol;
			this.showPlaceHolder(_dropCol);
			return;
		}
		const colBars = this.colsHeader?.find(Template.COLS_HEADER_ITEM_CLASS);
		if (!colBars) return;
		const tdElement = td.get<HTMLTableCellElement>()!;
		const colSpan = tdElement.colSpan;
		const [row, col] = this.table.selection.getCellPoint(td);
		let dropCol = col;
		let _passWidth = 0;

		for (let i = 0; i < colSpan; i++) {
			const colElement = colBars.eq(col + i)!.get<HTMLElement>()!;
			if (_passWidth + colElement.offsetWidth / 2 > event.offsetX) {
				dropCol = col + i;
				break;
			}
			if (_passWidth + colElement.offsetWidth > event.offsetX) {
				dropCol = col + i + 1;
				break;
			}
			_passWidth += colElement.offsetWidth;
		}
		this.showPlaceHolder(dropCol);
	};

	onDragColEnd = () => {
		this.unbindDragColEvent();
		const { index, count } = this.draggingHeader || {};
		if (!this.draggingHeader || index === undefined || count === undefined)
			return;
		const { command, selection } = this.table;
		const selectArea = selection.getSelectArea();
		const colBars = this.table.wrapper?.find(
			Template.COLS_HEADER_ITEM_CLASS,
		);
		if (!colBars) return;

		let widths = [];
		for (let c = selectArea.begin.col; c <= selectArea.end.col; c++) {
			widths.push(colBars.eq(c)?.get<HTMLElement>()?.offsetWidth || 0);
		}
		command.mockCopy();
		if (selectArea.begin.col > index) {
			command.insertColAt(index, count, false, widths, true);
			selection.selectCol(index, index + count - 1);
			command.mockPaste(true);
			selection.selectCol(
				selectArea.begin.col + count,
				selectArea.end.col + count,
			);
			command.removeCol();
			selection.selectCol(index, index + count - 1);
		} else {
			command.insertColAt(index, count, false, widths, true);
			selection.selectCol(index, index + count - 1);
			command.mockPaste(true);
			selection.selectCol(selectArea.begin.col, selectArea.end.col);
			command.removeCol();
			selection.selectCol(index - count, index - 1);
		}
		this.placeholder?.css('display', 'none');
		this.draggingHeader = undefined;
		this.dragging = undefined;
	};

	onDragRow = (event: DragEvent) => {
		event.stopPropagation();
		if (!this.draggingHeader || !event.target) return;
		if (undefined === this.dragging) {
			this.dragging = {
				x: event.offsetX,
				y: event.offsetY,
			};
		}
		// dragover会不断的触发事件，这里做一个截流，鼠标在3像素以内不去计算
		if (Math.abs(this.dragging.y - event.offsetY) < 3) return;
		this.dragging.y = event.offsetY;
		this.draggingHeader.element.removeClass('dragging');

		const td = $(event.target).closest('td');
		const rowBar = $(event.target).closest(Template.ROWS_HEADER_ITEM_CLASS);
		if (td.length === 0 && rowBar.length === 0) return;

		if (rowBar.length > 0) {
			const index = this.rowsHeader
				?.find(Template.ROWS_HEADER_ITEM_CLASS)
				.toArray()
				.findIndex(item => item.equal(rowBar));
			if (index === undefined) return;
			const currentRow = index;
			const _dropRow =
				event.offsetY > rowBar.get<HTMLElement>()!.offsetHeight / 2
					? currentRow + 1
					: currentRow;
			this.showPlaceHolder(_dropRow);
			return;
		}
		const rowBars = this.rowsHeader?.find(Template.ROWS_HEADER_ITEM_CLASS);
		if (!rowBars) return;
		const rowSpan = td.get<HTMLTableCellElement>()!.rowSpan;
		const [row] = this.table.selection.getCellPoint(td);
		let dropRow = row;
		let _passHeight = 0;

		for (let i = 0; i < rowSpan; i++) {
			const rowElement = rowBars[row + i] as HTMLTableRowElement;
			if (_passHeight + rowElement.offsetHeight / 2 > event.offsetY) {
				dropRow = row + i;
				break;
			}
			if (_passHeight + rowElement.offsetHeight > event.offsetY) {
				dropRow = row + i + 1;
				break;
			}
			_passHeight += rowElement.offsetHeight;
		}
		this.showPlaceHolder(dropRow);
	};

	onDragRowEnd = () => {
		this.unbindDragRowEvent();
		const { index, count } = this.draggingHeader || {};
		if (!this.draggingHeader || index === undefined || count === undefined)
			return;
		const { command, selection } = this.table;
		const selectArea = selection.getSelectArea();
		const { begin, end } = selectArea;
		command.mockCopy();

		if (begin.row > index) {
			command.insertRowAt(index, count, false, true);
			selection.selectRow(index, index + count - 1);
			command.mockPaste(true);
			selection.selectRow(begin.row + count, end.row + count);
			command.removeRow();
			selection.selectRow(index, index + count - 1);
		} else {
			command.insertRowAt(index, count, false, true);
			selection.selectRow(index, index + count - 1);
			command.mockPaste(true);
			selection.selectRow(begin.row, end.row);
			command.removeRow();
			selection.selectRow(index - count, index - 1);
		}
		this.placeholder?.css('display', 'none');
		this.draggingHeader = undefined;
		this.dragging = undefined;
	};

	removeRow(index: number) {
		const rowsHeaderItem = this.rowsHeader?.find(
			Template.ROWS_HEADER_ITEM_CLASS,
		);
		const item = rowsHeaderItem?.eq(index)?.get<HTMLElement>();
		if (item) this.rowsHeader?.get<HTMLElement>()?.removeChild(item);
	}

	removeCol(index: number) {
		const colsHeaderItem = this.colsHeader?.find(
			Template.COLS_HEADER_ITEM_CLASS,
		);
		const headerElement = this.colsHeader?.get<HTMLElement>();
		const item = colsHeaderItem?.eq(index)?.get<HTMLElement>();
		if (!headerElement || !item) return;
		this.colsHeader?.css(
			'width',
			headerElement.offsetWidth - item.offsetWidth + 'px',
		);
		headerElement.removeChild(item);
		this.tableRoot?.css('width', this.colsHeader?.css('width'));
	}

	showContextMenu(event: MouseEvent) {
		if (!this.menuBar || !event.target) return;
		const { selection } = this.table;
		const menuItems = this.menuBar.find(Template.MENUBAR_ITEM_CLASS);
		menuItems.removeClass('disabled');
		menuItems.each(menu => {
			const menuNode = $(menu);
			const action = menuNode.attributes('data-action');
			if (this.getMenuDisabled(action)) {
				menuNode.addClass('disabled');
			} else {
				const inputNode = menuNode.find(
					`input${Template.MENUBAR_ITEM_INPUT_CALSS}`,
				);
				if (inputNode.length === 0) return;
				const inputElement = inputNode.get<HTMLInputElement>()!;
				inputNode
					.on('blur', () => {
						inputElement.value = (
							parseInt(inputElement.value, 10) || 1
						).toString();
					})
					.on('keydown', event => {
						if (isHotkey('enter', event)) {
							this.handleTriggerMenu(menuNode);
						}
					});
				const selectArea = selection.getSelectArea();
				const isInsertCol =
					['insertColLeft', 'insertColRight'].indexOf(action) > -1;
				const isInsertRow =
					['insertRowUp', 'insertRowDown'].indexOf(action) > -1;
				if (isInsertCol) {
					inputElement.value = `${selectArea.end.col -
						selectArea.begin.col +
						1}`;
				}
				if (isInsertRow) {
					inputElement.value = `${selectArea.end.row -
						selectArea.begin.row +
						1}`;
				}
				inputNode.on('mousedown', this.onMenuInputMousedown);
			}
		});
		const splits = this.menuBar.find('div.split');
		splits.each(splitNode => {
			const split = $(splitNode);
			let prev = split.prev();
			while (prev) {
				if (prev.hasClass('split')) {
					split.remove();
					break;
				}
				if (!prev.hasClass('disabled')) break;
				prev = prev.prev();
			}
			if (!prev) split.remove();
		});
		const tartgetNode = $(event.target);
		let prevRect = tartgetNode.getBoundingClientRect() || {
			top: 0,
			left: 0,
		};
		let parentNode = tartgetNode.parent();
		let top = 0,
			left = 0;
		while (
			parentNode &&
			parentNode.closest(Template.TABLE_WRAPPER_CLASS).length > 0
		) {
			const rect = parentNode.getBoundingClientRect() || {
				top: 0,
				left: 0,
			};
			top += prevRect.top - rect.top;
			left += prevRect.left - rect.left;
			prevRect = rect;
			parentNode = parentNode.parent();
		}
		this.menuBar.css('left', left + event.offsetX + 'px');
		this.menuBar.css('top', top + event.offsetY + 'px');
		this.menuBar.css('display', 'block');
		//绑定input事件

		this.contextVisible = true;
	}

	onMenuInputMousedown = (event: MouseEvent) => {
		event.stopPropagation();
	};

	hideContextMenu() {
		if (!this.contextVisible) {
			return;
		}
		const menuItems = this.menuBar?.find(Template.MENUBAR_ITEM_CLASS);
		menuItems?.removeClass('disabled');
		menuItems?.each(menu => {
			const menuNode = $(menu);
			const inputNode = menuNode.find(
				`input${Template.MENUBAR_ITEM_INPUT_CALSS}`,
			);
			if (inputNode.length === 0) return;
			inputNode.removeAllEvents();
		});
		this.contextVisible = false;
		this.menuBar?.hide();
	}

	getMenuDisabled(action: string) {
		const { selection, command } = this.table;
		switch (action) {
			case 'cut':
			case 'copy':
				return !selection.selectArea || selection.selectArea.count <= 1;
			case 'splitCell':
				return !selection.hasMergeCell();
			case 'mergeCell':
				return !selection.selectArea;
			case 'mockPaste':
				return !command.hasCopyData();
			case 'removeCol':
			case 'insertColLeft':
			case 'insertColRight':
				return selection.isColSelected();
			case 'removeRow':
			case 'insertRowUp':
			case 'insertRowDown':
				return selection.isRowSelected();
			default:
				return false;
		}
	}

	handleClickMenu(event: MouseEvent) {
		if (!event.target) return;
		const targetNode = $(event.target);
		const menu = targetNode.closest('.table-menubar-item');
		if (menu.length === 0 || targetNode.name === 'input') return;
		event.stopPropagation();
		this.handleTriggerMenu(menu);
	}

	handleTriggerMenu(menu: NodeInterface) {
		if (!menu.hasClass('disabled')) {
			const action = menu.attributes('data-action');
			const inputNode = menu.find(
				`input${Template.MENUBAR_ITEM_INPUT_CALSS}`,
			);
			let args: undefined | number = undefined;
			if (inputNode.length > 0) {
				args = parseInt(
					inputNode.get<HTMLInputElement>()?.value || '1',
					10,
				);
			}
			this.table.command[action](args);
		}
		this.hideContextMenu();
	}

	handleHoverMenu(event: MouseEvent) {
		if (!event.target) return;
		const menu = $(event.target).closest('.table-menubar-item');
		if (menu.length === 0) return;
		event.stopPropagation();

		const { selection } = this.table;

		if (!menu.hasClass('disabled')) {
			const action = menu.attributes('data-action');
			switch (action) {
				case 'removeCol':
					this.handleHighlightCol();
					break;
				case 'removeRow':
					this.handleHighlightRow();
					break;
				case 'removeTable':
					this.handleHighlightTable();
					break;
				default:
					selection.hideHighlight();
			}
		}
	}

	hideHighlight(event: MouseEvent) {
		event.stopPropagation();
		this.table.selection.hideHighlight();
	}

	handleHighlightRow = () => {
		const { selection } = this.table;
		const { tableModel } = selection;
		if (!tableModel) return;
		const selectArea = { ...selection.getSelectArea() };
		selectArea.allCol = true;
		selectArea.begin = { row: selectArea.begin.row, col: 0 };
		selectArea.end = { row: selectArea.end.row, col: tableModel.cols - 1 };
		selection.showHighlight(selectArea);
	};

	handleHighlightCol = () => {
		const { selection } = this.table;
		const { tableModel } = selection;
		if (!tableModel) return;
		const selectArea = { ...selection.getSelectArea() };
		selectArea.allRow = true;
		selectArea.begin = { row: 0, col: selectArea.begin.col };
		selectArea.end = { row: tableModel.rows - 1, col: selectArea.end.col };
		selection.showHighlight(selectArea);
	};

	handleHighlightTable = () => {
		const { selection } = this.table;
		const { tableModel } = selection;
		if (!tableModel) return;
		const selectArea = { ...selection.getSelectArea() };
		selectArea.allRow = true;
		selectArea.allCol = true;
		selectArea.begin = { row: 0, col: 0 };
		selectArea.end = { row: tableModel.rows - 1, col: tableModel.cols - 1 };
		selection.showHighlight(selectArea);
	};
}

export default ControllBar;
