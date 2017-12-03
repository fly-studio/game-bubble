class Mesh extends MeshBase {

	//此类都是读取的函数

	public color(rowOrIndex: number, col?: number) : any {
		return this.cell(rowOrIndex, col).color;
	}

	public colorIndex(rowOrIndex: number, col?: number) : number {
		return this.cell(rowOrIndex, col).colorIndex;
	}

	public blank(rowOrIndex: number, col?: number) : boolean {
		return this.cell(rowOrIndex, col).blank;
	}

	public evenLast(rowOrIndex: number, col?: number) : boolean {
		return this.cell(rowOrIndex, col).evenLast;
	}

	public evenRow(rowOrIndex: number, col?: number) : boolean {
		return this.cell(rowOrIndex, col).evenRow;
	}

	public oddRow(rowOrIndex: number, col?: number) : boolean {
		return this.cell(rowOrIndex, col).oddRow;
	}

	public at(index: number) : Cell|null {
		if (index >= this.cells.length || index < 0)
			throw new Error('Out of "cells" Array\'s bound');
		return this.cells[index];
	}

	public cell(rowOrIndex: number, col?: number): Cell {
		let index: number = col == null ? rowOrIndex : this.index(rowOrIndex, col);
		return this.at(index);
	}

	protected randomColorIndex(rowOrIndex: number, col?: number): number {
		let random = (): number => {
			let colorCount:number = this.cellColors.length;
			return ~~(Math.random() * colorCount);
		};

		let row: number = rowOrIndex;
		if (col == null) {
			row = this.row(rowOrIndex);
			col = this.col(rowOrIndex);
		} else {
			rowOrIndex = this.index(row, col);
		}
		if (this.evenLast(row, col)) return -1; // 偶数行没最后一个

		let colorIndex:number = -1, crushes: CrushedGroup;
		let tmpCells: Cell[] = [...this.cells];
		tmpCells[rowOrIndex] = this.createCell(rowOrIndex);
		do {
			colorIndex = random();
			tmpCells[rowOrIndex].colorIndex = colorIndex;
			crushes = this.crushedCells(tmpCells).cellInGroup(rowOrIndex);
		} while (crushes.cellIndices.length >= 4); //别一下出现太多

		return colorIndex;
	}

	//此类都是写入的函数

	public createCell(rowOrIndex: number, col?: number) : Cell {
		let index: number = rowOrIndex;
		if (!isNaN(col))
			index = this.index(rowOrIndex, col);
		let cell: Cell = new Cell(this, index);
		cell.colorIndex = -1;
		return cell;
	}

	/**
	 * 初始化的时候 需要绘制的图形
	 */
	public createMesh(initIndices: number[]) : void
	{
		this.cells = [];
		for(let index of this.indicesEntries()) // fill all
			this.cells.push(this.createCell(index));

		initIndices.forEach(index => {
			let cell: Cell = this.cells[index];
			if (cell)
				cell.colorIndex = this.randomColorIndex(cell.row, cell.col);
		});
	}

	/****************************************/
	/* 下面都是消除函数 */
	/****************************************/


	public crushedCells(cells?: Cell[]) : CrushedCells {
		let crushes : CrushedCells = new CrushedCells(this);
		if (cells == null) cells = this.cells;

		let tmpCells: Cell[] = [];

		let dump = () => {
			if (tmpCells.length >= 2) //2连
				crushes.addCells(tmpCells);
			tmpCells.splice(0); // clear
		};

		let compareUp = (cell: Cell) => {
			let siblingCell: Cell;
			let row = cell.row;
			let col = cell.col;

			let rang = [[row - 1, col]]; //上一行 同col
			/**
			 * ●   ○ ← 测这个
			 *   ●     偶数行 实心圆col相同
			 */
			if (cell.evenRow)
				rang.push([row - 1, col + 1]);
			/**
			 * ↓ 测这个
			 * ○   ●
			 *   ●    奇数行 实心圆col相同
			 */
			else
				rang.push([row - 1, col - 1]);

			for (let i = 0; i < rang.length; i++) {
				let r = rang[i];
				if (r[1] < 0 || r[1] >= this.cols)
					continue;

				siblingCell = this.cell(r[0], r[1]);
				if (cell.sameColor(siblingCell))
					crushes.addCells([cell, siblingCell]);
			}
		}

		let compareLeft = (cell: Cell) => {
			if (cell.blank)
				dump();
			else if (tmpCells.length == 0)
				tmpCells.push(cell);
			else if (cell.sameColor(tmpCells[tmpCells.length - 1]) )
				tmpCells.push(cell);
			else if (!cell.sameColor(tmpCells[tmpCells.length - 1]) )
			{
				dump();
				tmpCells.push(cell);
			}
		}

		for(let row of this.rowsEntries()) {
			for(let col of this.colsEntries()) {
				let cell: Cell = cells[this.index(row, col)];
				if (!cell)
					continue;
				//计算横向的2个相连
				compareLeft(cell);
				//计算上面一行2个相连
				if (row > 0)
					compareUp(cell);
			}
			dump();
		}
		return crushes;
	}

}
