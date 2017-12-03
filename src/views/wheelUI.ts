namespace ui {
	export class WheelUI extends layer.ui.Sprite {

		public onAddedToStage(event: egret.Event) : void {
			let wheelSprite = new egret.Shape;
			wheelSprite.graphics.beginFill(0x0, 0.6);
			wheelSprite.graphics.lineStyle(1, 0x0, 0.8);

			this.addChild(wheelSprite);
		}

		public onRemovedFromStage(event: egret.Event): void {
			this.removeAllEventListeners();
		}

		public removeAllEventListeners(): void {

		}
	}
}
