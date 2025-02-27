import { isMacos } from '@aomao/engine';

export default {
	toolbar: {
		collapse: {
			title: `Type <code>${
				isMacos ? '⌘' : 'Ctrl'
			}</code> + <code>/</code> to quickly insert a card`,
		},
		undo: {
			title: 'Undo',
		},
		redo: {
			title: 'Redo',
		},
		paintformat: {
			title: 'Format brush',
		},
		removeformat: {
			title: 'Clear format',
		},
		heading: {
			title: 'Text and title',
			p: 'Text',
			h1: 'Heading 1',
			h2: 'Heading 2',
			h3: 'Heading 3',
			h4: 'Heading 4',
			h5: 'Heading 5',
			h6: 'Heading 6',
		},
		fontsize: {
			title: 'Font size',
		},
		fontcolor: {
			title: 'Font color',
			more: 'More colors',
		},
		backcolor: {
			title: 'Background color',
			more: 'More colors',
		},
		bold: {
			title: 'Bold',
		},
		italic: {
			title: 'Italic',
		},
		strikethrough: {
			title: 'Strikethrough',
		},
		underline: {
			title: 'Underline',
		},
		moremark: {
			title: 'More text styles',
			sup: 'Sup',
			sub: 'Sub',
			code: 'Inline code',
		},
		alignment: {
			title: 'Alignment',
			left: 'Align left',
			center: 'Align center',
			right: 'Align right',
			justify: 'Align justify',
		},
		unorderedlist: {
			title: 'Unordered list',
		},
		orderedlist: {
			title: 'Ordered list',
		},
		tasklist: {
			title: 'Task list',
		},
		indent: {
			title: 'Ident',
			in: 'Increase indent',
			out: 'Reduce indent',
		},
		link: {
			title: 'Insert Link',
		},
		quote: {
			title: 'Insert reference',
		},
		hr: {
			title: 'Insert dividing line',
		},
		colorPicker: {
			defaultText: 'Default Color',
			nonFillText: 'No fill color',
			'#000000': 'Black',
			'#262626': 'Dark Gray 3',
			'#595959': 'Dark Gray 2',
			'#8C8C8C': 'Dark Gray 1',
			'#BFBFBF': 'Gray',
			'#D9D9D9': 'Light Gray 4',
			'#E9E9E9': 'Light Gray 3',
			'#F5F5F5': 'Light Gray 2',
			'#FAFAFA': 'Light Gray 1',
			'#FFFFFF': 'White',
			'#F5222D': 'Red',
			'#FA541C': 'Chinese Red',
			'#FA8C16': 'Orange',
			'#FADB14': 'Yellow',
			'#52C41A': 'Green',
			'#13C2C2': 'Cyan',
			'#1890FF': 'Light Blue',
			'#2F54EB': 'Blue',
			'#722ED1': 'Purple',
			'#EB2F96': 'Magenta',
			'#FFE8E6': 'Red 1',
			'#FFECE0': 'Chinese Red 1',
			'#FFEFD1': 'Orange 1',
			'#FCFCCA': 'Yellow 1',
			'#E4F7D2': 'Green 1',
			'#D3F5F0': 'Cyan 1',
			'#D4EEFC': 'Light Blue 1',
			'#DEE8FC': 'Blue 1',
			'#EFE1FA': 'Purple 1',
			'#FAE1EB': 'Magenta 1',
			'#FFA39E': 'Red 2',
			'#FFBB96': 'Chinese Red 2',
			'#FFD591': 'Orange 2',
			'#FFFB8F': 'Yellow 2',
			'#B7EB8F': 'Green 2',
			'#87E8DE': 'Cyan 2',
			'#91D5FF': 'Light Blue 2',
			'#ADC6FF': 'Blue 2',
			'#D3ADF7': 'Purple 2',
			'#FFADD2': 'Magenta 2',
			'#FF4D4F': 'Red 3',
			'#FF7A45': 'Chinese Red 3',
			'#FFA940': 'Orange 3',
			'#FFEC3D': 'Yellow 3',
			'#73D13D': 'Green 3',
			'#36CFC9': 'Cyan 3',
			'#40A9FF': 'Light Blue 3',
			'#597EF7': 'Blue 3',
			'#9254DE': 'Purple 3',
			'#F759AB': 'Magenta 3',
			'#CF1322': 'Red 4',
			'#D4380D': 'Chinese Red 4',
			'#D46B08': 'Orange 4',
			'#D4B106': 'Yellow 4',
			'#389E0D': 'Green 4',
			'#08979C': 'Cyan 4',
			'#096DD9': 'Light Blue 4',
			'#1D39C4': 'Blue 4',
			'#531DAB': 'Purple 4',
			'#C41D7F': 'Magenta 4',
			'#820014': 'Red 5',
			'#871400': 'Chinese Red 5',
			'#873800': 'Orange 5',
			'#614700': 'Yellow 5',
			'#135200': 'Green 5',
			'#00474F': 'Cyan 5',
			'#003A8C': 'Light Blue 5',
			'#061178': 'Blue 5',
			'#22075E': 'Purple 5',
			'#780650': 'Magenta 5',
		},
		component: {
			placeholder: 'Card name',
		},
		image: {
			title: 'Image',
		},
		codeblock: {
			title: 'Codeblock',
		},
		table: {
			title: 'Table',
		},
		file: {
			title: 'File',
		},
		video: {
			title: 'Video',
		},
		math: {
			title: 'Formula',
		},
		commonlyUsed: {
			title: 'Commonly used',
		},
	},
};
