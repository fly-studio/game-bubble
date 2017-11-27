namespace ui {
	export class BubbleUI extends layer.ui.Sprite {
		public cell: Cell;

		constructor(cell?: Cell)
		{
			super();
			this.cell = cell;
		}

		public onAddedToStage(event: egret.Event) : void {
			if (this.width <= 0 || this.height <= 0)
				throw new Error('set width,height, first');
			
			if (this.cell.blank)
				return;
				
			this.graphics.lineStyle(1, this.cell.color);
			this.graphics.drawCircle(this.width / 2, this.height / 2, this.width / 2);
			this.graphics.beginFill(this.cell.color, 0.4);
			this.graphics.drawCircle(this.width / 2, this.height / 2, this.width / 2)
			this.graphics.endFill();
		}

		public onRemovedFromStage(event: egret.Event): void {
			this.removeAllEventListeners();
		}

		public removeAllEventListeners(): void {

		}

	}

}