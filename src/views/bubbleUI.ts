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

			let text = new egret.TextField;
			text.size = 20;
			text.width = this.width;
			text.textColor = 0xffffff;
			text.textAlign = "center";
			text.text = this.cell.index.toString();
			text.x = 0;
			text.y = this.height / 2 - text.height / 2;
			this.addChild(text);
		}

		public onRemovedFromStage(event: egret.Event): void {
			this.removeAllEventListeners();
		}

		public removeAllEventListeners(): void {

		}

	}

}
