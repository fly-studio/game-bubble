namespace ui {
	export class MeshUI extends layer.ui.Sprite {
		public colorList: number[];

		private mesh: Mesh;
		private radius: number;
		private diameter: number;
		private crossDeltaHeight: number;

		constructor(mesh: Mesh)
		{
			super();

			this.mesh = mesh;
		}

		public onAddedToStage(event: egret.Event) : void {
			if (this.width <= 0 || this.height <= 0)
				throw new Error('set width,height, first');

			this.diameter = this.width / this.mesh.cols;
			this.radius = this.diameter / 2;
			this.crossDeltaHeight = this.diameter -  this.diameter * Math.cos(layer.sharp.d2r(30));
			this.renderMesh();
		}

		public onRemovedFromStage(event: egret.Event): void {
			this.removeAllEventListeners();
		}

		public removeAllEventListeners(): void {

		}

		public getCellPoint(rowOrIndex: number, col: number)
		{
			let row: number = rowOrIndex;
			if (col == null)
			{
				row = this.mesh.row(rowOrIndex);
				col = this.mesh.col(rowOrIndex);
			}

			let x: number = col * this.diameter;
			let y: number = row * this.diameter - this.crossDeltaHeight * row; //减去圆顶部相交的地方

			if (row % 2 == 1) // 偶数行
				x += this.radius
			return new egret.Point(x, y);
		}

		public getCellRectangle(rowOrIndex: number, col?: number) : egret.Rectangle {
			let position: egret.Point = this.getCellPoint(rowOrIndex, col);
			return new egret.Rectangle(
				position.x,
				position.y,
				this.diameter,
				this.diameter
			);
		}

		public createCellUI(cell: Cell, rect: egret.Rectangle)
		{
			let ui: BubbleUI = new BubbleUI(cell);
			ui.x = rect.x;
			ui.y = rect.y;
			ui.width = rect.width;
			ui.height = rect.height;
			ui.name = "cell";
			return ui;
		}

		public renderMesh() : void
		{
			this.removeChildren();

			for(let index of this.mesh.indicesEntries()) {
				let cellUI: BubbleUI = this.createCellUI(this.mesh.cell(index), this.getCellRectangle(index));
				this.addChild(cellUI);
			}
		}

	}
}