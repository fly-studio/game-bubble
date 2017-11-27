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
			let upCell: Cell;
			let row = cell.row;
			let col = cell.col;

			upCell = this.cell(row - 1, col); //上一行
			if (cell.sameColor(upCell))
				crushes.addCells([cell, upCell]);
			if (row % 2 == 1 && col < this.cols - 1) // 偶数行
			{
				/**
				 * ●   ○ ← 测这个 
				 *   ●     实心圆col相同
				 */
				upCell = this.cell(row - 1, col + 1); //计算右边的
				if (cell.sameColor(upCell))
					crushes.addCells([cell, upCell]);
			} else if (row % 2 != 1 && col > 0) { // 奇数行
				/**
				 * ↓ 测这个
				 * ○   ●
				 *   ●    实心圆col相同
				 */
				upCell = this.cell(row - 1, col - 1); //计算左边的
				if (cell.sameColor(upCell))
					crushes.addCells([cell, upCell]);
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